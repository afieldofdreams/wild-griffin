import { Router, Request, Response } from "express";
import { z } from "zod";
import { pool } from "../db/pool";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../middleware/error";

export const sitesRouter = Router();

const nearbySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(100).max(10000).default(1000),
  limit: z.coerce.number().min(1).max(100).default(50),
});

// GET /v1/sites/nearby — no auth required (browse before register)
sitesRouter.get("/nearby", asyncHandler(async (req: Request, res: Response) => {
  const params = nearbySchema.parse(req.query);

  const result = await pool.query(
    `SELECT
       id, name, type,
       ST_X(geometry) as lon,
       ST_Y(geometry) as lat,
       total_surveys,
       unique_surveyors,
       last_surveyed_at,
       CURRENT_DATE - last_surveyed_at::date as days_since_survey
     FROM sites
     WHERE ST_DWithin(
       geometry::geography,
       ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
       $3
     )
     ORDER BY geometry <-> ST_SetSRID(ST_MakePoint($1, $2), 4326)
     LIMIT $4`,
    [params.lon, params.lat, params.radius, params.limit],
  );

  res.json({ sites: result.rows });
}));

// GET /v1/sites/:id — full site detail
sitesRouter.get("/:id", asyncHandler(async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT
       id, name, type,
       ST_X(geometry) as lon,
       ST_Y(geometry) as lat,
       radius_m, region, source,
       total_surveys, unique_surveyors,
       quality_score, last_surveyed_at,
       created_at
     FROM sites
     WHERE id = $1`,
    [req.params.id],
  );

  if (result.rows.length === 0) {
    res.status(404).json({ error: "Site not found" });
    return;
  }

  res.json({ site: result.rows[0] });
}));

// GET /v1/sites/:id/timeline — survey history for a site
sitesRouter.get("/:id/timeline", asyncHandler(async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT
       s.id, s.photo_url, s.answers, s.tokens_awarded,
       s.multiplier_applied, s.submitted_at,
       u.display_name as surveyor_name
     FROM surveys s
     JOIN users u ON u.id = s.user_id
     WHERE s.site_id = $1
     ORDER BY s.submitted_at DESC
     LIMIT 50`,
    [req.params.id],
  );

  res.json({ timeline: result.rows });
}));

// POST /v1/sites/suggest — suggest new site (Level 3+)
sitesRouter.post("/suggest", requireAuth, asyncHandler(async (req: Request, res: Response) => {
  // TODO: Validate user level >= 3, create pending site
  res.status(501).json({ message: "Not yet implemented" });
}));
