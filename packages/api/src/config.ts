import path from "path";
import { config as dotenvConfig } from "dotenv";
import { z } from "zod";

dotenvConfig({ path: path.resolve(__dirname, "../../../.env") });

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  DATABASE_SSL: z
    .string()
    .transform((v) => v === "true")
    .default("false"),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRY: z.string().default("15m"),
  REFRESH_TOKEN_EXPIRY: z.string().default("30d"),
  AWS_REGION: z.string().default("eu-west-2"),
  S3_BUCKET: z.string().default("wild-griffin-photos"),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export const config = envSchema.parse(process.env);
