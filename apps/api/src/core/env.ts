import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ quiet: true });

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(8000),
  LOG_LEVEL: z.string().default("info"),
  SERVICE_NAME: z.string().default("inspection-ai-api"),

  DATABASE_URL: z.string(),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
});

// Parse and validate
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error(
    "Invalid environment variables:",
    JSON.stringify(parsedEnv.error.issues, null, 2)
  );
  process.exit(1);
}

const env = parsedEnv.data;

export type EnvConfig = z.infer<typeof envSchema>;
export const ENV: EnvConfig = { ...env };
