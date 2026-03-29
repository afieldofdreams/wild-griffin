import { Router, Request, Response } from "express";
import { pool } from "../db/pool";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../middleware/error";
import { USER_REVENUE_SHARE } from "@wild-griffin/shared";

export const walletRouter = Router();

walletRouter.use(requireAuth);

// GET /v1/wallet/balance
walletRouter.get("/balance", asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;

  const balanceResult = await pool.query(
    `SELECT
       COALESCE(SUM(amount), 0) as total_tokens,
       COALESCE(SUM(amount) FILTER (WHERE month_key = to_char(CURRENT_DATE, 'YYYY-MM')), 0) as current_month_tokens
     FROM token_ledger
     WHERE user_id = $1`,
    [userId],
  );

  const userResult = await pool.query(
    "SELECT total_surveys, total_tokens_earned, level, xp FROM users WHERE id = $1",
    [userId],
  );

  res.json({
    balance: parseInt(balanceResult.rows[0].total_tokens),
    currentMonthTokens: parseInt(balanceResult.rows[0].current_month_tokens),
    ...userResult.rows[0],
  });
}));

// GET /v1/wallet/estimate — estimated payout for current month
walletRouter.get("/estimate", asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const monthKey = new Date().toISOString().slice(0, 7);

  const userTokens = await pool.query(
    "SELECT COALESCE(SUM(amount), 0) as tokens FROM token_ledger WHERE user_id = $1 AND month_key = $2",
    [userId, monthKey],
  );

  const poolResult = await pool.query(
    "SELECT total_ad_revenue, total_tokens_earned FROM monthly_revenue_pool WHERE month_key = $1",
    [monthKey],
  );

  if (poolResult.rows.length === 0 || poolResult.rows[0].total_tokens_earned === 0) {
    res.json({ estimatedPayout: 0, tokens: parseInt(userTokens.rows[0].tokens), note: "No revenue data yet" });
    return;
  }

  const pool_ = poolResult.rows[0];
  const payoutFund = pool_.total_ad_revenue * USER_REVENUE_SHARE;
  const tokenValue = payoutFund / pool_.total_tokens_earned;
  const estimated = tokenValue * parseInt(userTokens.rows[0].tokens);

  res.json({
    estimatedPayout: Math.round(estimated * 100) / 100,
    tokenValue: Math.round(tokenValue * 1000000) / 1000000,
    tokens: parseInt(userTokens.rows[0].tokens),
    note: "Estimate only — final value calculated at month end",
  });
}));

// GET /v1/wallet/history — paginated ledger
walletRouter.get("/history", asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const offset = parseInt(req.query.offset as string) || 0;

  const result = await pool.query(
    `SELECT id, type, amount, month_key, reference_type, created_at
     FROM token_ledger
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset],
  );

  res.json({ entries: result.rows, limit, offset });
}));

// POST /v1/wallet/withdraw
walletRouter.post("/withdraw", asyncHandler(async (_req: Request, res: Response) => {
  // TODO: PayPal integration, minimum checks, probation check
  res.status(501).json({ message: "Not yet implemented" });
}));

// GET /v1/wallet/monthly-summary/:month
walletRouter.get("/monthly-summary/:month", asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const monthKey = req.params.month;

  const result = await pool.query(
    `SELECT
       tl.month_key,
       SUM(tl.amount) as tokens_earned,
       mrp.token_value,
       SUM(tl.amount) * mrp.token_value as payout,
       mrp.status as pool_status
     FROM token_ledger tl
     LEFT JOIN monthly_revenue_pool mrp ON mrp.month_key = tl.month_key
     WHERE tl.user_id = $1 AND tl.month_key = $2
     GROUP BY tl.month_key, mrp.token_value, mrp.status`,
    [userId, monthKey],
  );

  if (result.rows.length === 0) {
    res.status(404).json({ error: "No data for this month" });
    return;
  }

  res.json({ summary: result.rows[0] });
}));
