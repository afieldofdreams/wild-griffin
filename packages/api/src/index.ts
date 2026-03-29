import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config";
import { pool } from "./db/pool";
import { authRouter } from "./routes/auth";
import { sitesRouter } from "./routes/sites";
import { surveysRouter } from "./routes/surveys";
import { walletRouter } from "./routes/wallet";
import { userRouter } from "./routes/user";
import { errorHandler } from "./middleware/error";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: "unhealthy" });
  }
});

// Routes
app.use("/v1/auth", authRouter);
app.use("/v1/sites", sitesRouter);
app.use("/v1/surveys", surveysRouter);
app.use("/v1/wallet", walletRouter);
app.use("/v1/user", userRouter);

// Error handler
app.use(errorHandler);

app.listen(config.PORT, () => {
  console.log(`Wild Griffin API running on port ${config.PORT}`);
});
