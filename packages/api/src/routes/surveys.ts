import { Router, Request, Response } from "express";
import { z } from "zod";
import { pool } from "../db/pool";
import { requireAuth } from "../middleware/auth";
import { AppError, asyncHandler } from "../middleware/error";
import {
  SURVEY_SCHEMAS,
  SITE_TYPES,
  BASE_SURVEY_TOKENS,
  FIRST_SURVEY_BONUS,
  VISIT_MULTIPLIERS,
  QUALITY_BONUS_THRESHOLD,
  QUALITY_BONUS_MULTIPLIER,
  MAX_SURVEYS_PER_DAY,
  SAME_SITE_COOLDOWN_DAYS,
  MIN_TIME_AT_SITE_SECONDS,
  GPS_PROXIMITY_THRESHOLD_M,
} from "@wild-griffin/shared";

export const surveysRouter = Router();

const submitSurveySchema = z.object({
  siteId: z.string().uuid(),
  idempotencyKey: z.string().uuid(),
  photoKey: z.string().optional(),
  answers: z.record(z.union([z.string(), z.array(z.string()), z.number()])),
  gpsLat: z.number().min(-90).max(90),
  gpsLon: z.number().min(-180).max(180),
  gpsAccuracyM: z.number().min(0),
  deviceSensors: z
    .object({
      barometricPressure: z.number().optional(),
      ambientLight: z.number().optional(),
      noiseLevel: z.number().optional(),
    })
    .optional(),
  durationSeconds: z.number().int().min(0),
  submittedAt: z.string().datetime(),
});

// POST /v1/surveys — submit a survey
surveysRouter.post("/", requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const body = submitSurveySchema.parse(req.body);
  const userId = req.userId!;

  // Idempotency: check if this survey was already submitted
  const existing = await pool.query(
    "SELECT id, tokens_awarded FROM surveys WHERE idempotency_key = $1",
    [body.idempotencyKey],
  );
  if (existing.rows.length > 0) {
    res.json({ survey: existing.rows[0], duplicate: true });
    return;
  }

  // Validate site exists and get type
  const siteResult = await pool.query(
    "SELECT id, type, ST_X(geometry) as lon, ST_Y(geometry) as lat, radius_m FROM sites WHERE id = $1",
    [body.siteId],
  );
  if (siteResult.rows.length === 0) {
    throw new AppError(404, "Site not found");
  }
  const site = siteResult.rows[0];

  // GPS proximity check
  const distResult = await pool.query(
    `SELECT ST_Distance(
       ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
       ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography
     ) as distance_m`,
    [body.gpsLon, body.gpsLat, site.lon, site.lat],
  );
  const distanceM = distResult.rows[0].distance_m;
  if (distanceM > (site.radius_m || GPS_PROXIMITY_THRESHOLD_M)) {
    throw new AppError(422, `Too far from site (${Math.round(distanceM)}m away)`);
  }

  // Minimum time check
  if (body.durationSeconds < MIN_TIME_AT_SITE_SECONDS) {
    throw new AppError(422, `Minimum ${MIN_TIME_AT_SITE_SECONDS}s at site required`);
  }

  // Daily survey cap
  const todayCount = await pool.query(
    "SELECT COUNT(*) FROM surveys WHERE user_id = $1 AND submitted_at::date = CURRENT_DATE",
    [userId],
  );
  if (parseInt(todayCount.rows[0].count) >= MAX_SURVEYS_PER_DAY) {
    throw new AppError(429, "Daily survey limit reached");
  }

  // Same-site cooldown
  const lastVisit = await pool.query(
    `SELECT submitted_at FROM surveys
     WHERE user_id = $1 AND site_id = $2
     ORDER BY submitted_at DESC LIMIT 1`,
    [userId, body.siteId],
  );
  if (lastVisit.rows.length > 0) {
    const daysSince = Math.floor(
      (Date.now() - new Date(lastVisit.rows[0].submitted_at).getTime()) /
        (1000 * 60 * 60 * 24),
    );
    if (daysSince < SAME_SITE_COOLDOWN_DAYS) {
      throw new AppError(
        429,
        `Must wait ${SAME_SITE_COOLDOWN_DAYS - daysSince} more days before resurveying this site`,
      );
    }
  }

  // Calculate visit number for this user at this site
  const visitCount = await pool.query(
    "SELECT COUNT(*) FROM surveys WHERE user_id = $1 AND site_id = $2",
    [userId, body.siteId],
  );
  const visitNumber = parseInt(visitCount.rows[0].count) + 1;

  // Calculate multiplier
  let multiplier = 1.0;
  for (const [threshold, mult] of Object.entries(VISIT_MULTIPLIERS).sort(
    ([a], [b]) => Number(b) - Number(a),
  )) {
    if (visitNumber >= Number(threshold)) {
      multiplier = mult as number;
      break;
    }
  }

  // Check reputation for quality bonus
  const userResult = await pool.query(
    "SELECT reputation_score, total_surveys FROM users WHERE id = $1",
    [userId],
  );
  const user = userResult.rows[0];
  if (user.reputation_score >= QUALITY_BONUS_THRESHOLD) {
    multiplier *= QUALITY_BONUS_MULTIPLIER;
  }

  // Calculate tokens
  const isFirstSurvey = user.total_surveys === 0;
  const baseTokens = isFirstSurvey ? FIRST_SURVEY_BONUS : BASE_SURVEY_TOKENS;
  const tokensAwarded = Math.round(baseTokens * multiplier);

  const monthKey = new Date().toISOString().slice(0, 7); // YYYY-MM

  // Insert survey + update token ledger + update site + update user in a transaction
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const surveyResult = await client.query(
      `INSERT INTO surveys (
         user_id, site_id, idempotency_key, visit_number,
         photo_url, answers, gps_lat, gps_lon, gps_accuracy_m,
         device_sensors, duration_seconds, tokens_awarded,
         multiplier_applied, submitted_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING id`,
      [
        userId,
        body.siteId,
        body.idempotencyKey,
        visitNumber,
        body.photoKey ? `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${body.photoKey}` : null,
        JSON.stringify(body.answers),
        body.gpsLat,
        body.gpsLon,
        body.gpsAccuracyM,
        JSON.stringify(body.deviceSensors || {}),
        body.durationSeconds,
        tokensAwarded,
        multiplier,
        body.submittedAt,
      ],
    );

    // Token ledger entry
    await client.query(
      `INSERT INTO token_ledger (user_id, type, amount, month_key, reference_type, reference_id)
       VALUES ($1, 'survey_reward', $2, $3, 'survey', $4)`,
      [userId, tokensAwarded, monthKey, surveyResult.rows[0].id],
    );

    // Update user stats
    await client.query(
      `UPDATE users SET
         total_surveys = total_surveys + 1,
         total_tokens_earned = total_tokens_earned + $2,
         xp = xp + $3,
         last_active_at = NOW()
       WHERE id = $1`,
      [userId, tokensAwarded, tokensAwarded * 10],
    );

    // Update site stats
    await client.query(
      `UPDATE sites SET
         total_surveys = total_surveys + 1,
         unique_surveyors = (
           SELECT COUNT(DISTINCT user_id) FROM surveys WHERE site_id = $1
         ),
         last_surveyed_at = NOW()
       WHERE id = $1`,
      [body.siteId],
    );

    await client.query("COMMIT");

    res.status(201).json({
      survey: {
        id: surveyResult.rows[0].id,
        tokensAwarded,
        multiplier,
        visitNumber,
        isFirstSurvey,
      },
    });
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}));

// POST /v1/surveys/upload-url — get pre-signed S3 URL
surveysRouter.post("/upload-url", requireAuth, asyncHandler(async (_req: Request, res: Response) => {
  // TODO: Generate pre-signed S3 URL
  res.status(501).json({ message: "Not yet implemented — use photoKey in survey submit" });
}));

// GET /v1/surveys/:id/status
surveysRouter.get("/:id/status", requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const result = await pool.query(
    "SELECT id, photo_verified, quality_flags, processed_at FROM surveys WHERE id = $1 AND user_id = $2",
    [req.params.id, req.userId],
  );
  if (result.rows.length === 0) {
    res.status(404).json({ error: "Survey not found" });
    return;
  }
  res.json({ survey: result.rows[0] });
}));
