import { Router, Request, Response } from "express";
import { z } from "zod";
import { pool } from "../db/pool";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../middleware/error";

export const userRouter = Router();

userRouter.use(requireAuth);

// GET /v1/user/profile
userRouter.get("/profile", asyncHandler(async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT
       id, display_name, level, xp, reputation_score,
       total_surveys, total_tokens_earned, referral_code,
       created_at
     FROM users WHERE id = $1`,
    [req.userId],
  );

  if (result.rows.length === 0) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({ user: result.rows[0] });
}));

// PATCH /v1/user/profile
const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  notificationPrefs: z
    .object({
      site_health: z.boolean().optional(),
      streak: z.boolean().optional(),
      earnings: z.boolean().optional(),
      community: z.boolean().optional(),
      referral: z.boolean().optional(),
    })
    .optional(),
  quietHoursStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  quietHoursEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

userRouter.patch("/profile", asyncHandler(async (req: Request, res: Response) => {
  const body = updateProfileSchema.parse(req.body);
  const updates: string[] = [];
  const values: unknown[] = [];
  let paramIdx = 1;

  if (body.displayName) {
    updates.push(`display_name = $${paramIdx++}`);
    values.push(body.displayName);
  }
  if (body.notificationPrefs) {
    updates.push(`notification_prefs = notification_prefs || $${paramIdx++}::jsonb`);
    values.push(JSON.stringify(body.notificationPrefs));
  }
  if (body.quietHoursStart) {
    updates.push(`quiet_hours_start = $${paramIdx++}`);
    values.push(body.quietHoursStart);
  }
  if (body.quietHoursEnd) {
    updates.push(`quiet_hours_end = $${paramIdx++}`);
    values.push(body.quietHoursEnd);
  }

  if (updates.length === 0) {
    res.status(400).json({ error: "No fields to update" });
    return;
  }

  values.push(req.userId);
  const result = await pool.query(
    `UPDATE users SET ${updates.join(", ")} WHERE id = $${paramIdx} RETURNING id, display_name, notification_prefs, quiet_hours_start, quiet_hours_end`,
    values,
  );

  res.json({ user: result.rows[0] });
}));

// GET /v1/user/sites — sites this user has surveyed
userRouter.get("/sites", asyncHandler(async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT
       s.id, s.name, s.type,
       ST_X(s.geometry) as lon, ST_Y(s.geometry) as lat,
       COUNT(sv.id) as visit_count,
       MAX(sv.submitted_at) as last_visited,
       MAX(sv.multiplier_applied) as current_multiplier
     FROM sites s
     JOIN surveys sv ON sv.site_id = s.id AND sv.user_id = $1
     GROUP BY s.id
     ORDER BY last_visited DESC`,
    [req.userId],
  );

  res.json({ sites: result.rows });
}));

// GET /v1/user/streaks
userRouter.get("/streaks", asyncHandler(async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT
       sk.id, sk.current_streak_weeks, sk.longest_streak_weeks,
       sk.streak_at_risk,
       s.id as site_id, s.name as site_name, s.type as site_type
     FROM streaks sk
     JOIN sites s ON s.id = sk.site_id
     WHERE sk.user_id = $1 AND sk.current_streak_weeks > 0
     ORDER BY sk.current_streak_weeks DESC`,
    [req.userId],
  );

  res.json({ streaks: result.rows });
}));

// GET /v1/user/referral-code
userRouter.get("/referral-code", asyncHandler(async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT
       u.referral_code,
       COUNT(r.id) as total_referrals,
       COALESCE(SUM(CASE WHEN r.completed THEN 1 ELSE 0 END), 0) as completed_referrals
     FROM users u
     LEFT JOIN referrals r ON r.referrer_id = u.id
     WHERE u.id = $1
     GROUP BY u.id`,
    [req.userId],
  );

  res.json(result.rows[0]);
}));
