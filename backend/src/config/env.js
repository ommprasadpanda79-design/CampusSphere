import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  JWT_SECRET: z.string().min(16).default("development-access-secret-change-me"),
  JWT_REFRESH_SECRET: z.string().min(16).default("development-refresh-secret-change-me"),
  AI_SERVICE_URL: z.string().url().default("http://localhost:8000"),
  FRONTEND_URL: z.string().default("http://localhost:5173"),
  COOKIE_SECURE: z.enum(["true", "false"]).optional(),
});

export const env = envSchema.parse(process.env);
