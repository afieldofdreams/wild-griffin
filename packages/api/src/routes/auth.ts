import { Router, Request, Response } from "express";
import { z } from "zod";
import { pool } from "../db/pool";
import { AppError, asyncHandler } from "../middleware/error";

export const authRouter = Router();

const registerSchema = z.object({
  phoneNumber: z.string().regex(/^\+[1-9]\d{6,14}$/, "Invalid phone number (E.164 format)"),
  referralCode: z.string().max(8).optional(),
});

const verifySchema = z.object({
  phoneNumber: z.string(),
  otp: z.string().length(6),
});

// POST /v1/auth/register — send OTP to phone number
authRouter.post("/register", asyncHandler(async (req: Request, res: Response) => {
  const body = registerSchema.parse(req.body);

  // TODO: Integrate with Cognito to send OTP
  // For now, store in DB and return success
  // In development, OTP is always 123456

  res.json({
    message: "OTP sent",
    // Only in dev mode
    ...(process.env.NODE_ENV === "development" && { devOtp: "123456" }),
  });
}));

// POST /v1/auth/verify — verify OTP, return JWT
authRouter.post("/verify", asyncHandler(async (req: Request, res: Response) => {
  const body = verifySchema.parse(req.body);

  // TODO: Verify OTP with Cognito
  // For dev: accept 123456
  if (process.env.NODE_ENV === "development" && body.otp !== "123456") {
    throw new AppError(401, "Invalid OTP");
  }

  // Find existing user by checking phone hash, or create new one
  // bcrypt hashes are unique each time, so we can't use ON CONFLICT.
  // Instead, we store a deterministic hash for lookup and bcrypt for security.
  const existing = await pool.query(
    `SELECT id, display_name, level, xp, total_surveys FROM users
     WHERE phone_hash = crypt($1, phone_hash)`,
    [body.phoneNumber],
  );

  let user;
  if (existing.rows.length > 0) {
    user = existing.rows[0];
    await pool.query("UPDATE users SET last_active_at = NOW() WHERE id = $1", [user.id]);
  } else {
    const created = await pool.query(
      `INSERT INTO users (phone_hash, display_name)
       VALUES (crypt($1, gen_salt('bf')), 'Griffin ' || substr(md5(random()::text), 1, 4))
       RETURNING id, display_name, level, xp, total_surveys`,
      [body.phoneNumber],
    );
    user = created.rows[0];
  }

  // TODO: Generate proper JWT via Cognito
  res.json({
    token: user.id, // Placeholder: user ID as token in dev
    refreshToken: "refresh-" + user.id,
    user: {
      id: user.id,
      displayName: user.display_name,
      level: user.level,
      xp: user.xp,
      totalSurveys: user.total_surveys,
    },
  });
}));

// POST /v1/auth/refresh
authRouter.post("/refresh", asyncHandler(async (_req: Request, res: Response) => {
  // TODO: Cognito refresh token flow
  res.json({ message: "Not yet implemented" });
}));

// POST /v1/auth/logout
authRouter.post("/logout", asyncHandler(async (_req: Request, res: Response) => {
  // TODO: Invalidate refresh token
  res.json({ message: "Logged out" });
}));
