import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3003),
  HOST: z.string().default("127.0.0.1"),

  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().default("redis://localhost:6379"),

  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_REDIRECT_URI: z.string().url().default("http://localhost:3003/auth/google/callback"),

  JWT_SECRET: z.string().default("super-secret-jwt-key-change-me"),

  ALLOWED_ORIGINS: z.string().default("http://localhost:5173"),
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),

  NOMBA_CLIENT_ID: z.string().optional().default(""),
  NOMBA_CLIENT_SECRET: z.string().optional().default(""),
  NOMBA_ACCOUNT_ID: z.string().optional().default(""),
  NOMBA_SANDBOX: z.string().optional().default("true"),
  NOMBA_WEBHOOK_SECRET: z.string().optional().default(""),
});

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
    process.exit(1);
  }

  return parsed.data;
}

export const env = loadEnv();

export type Env = z.infer<typeof envSchema>;
