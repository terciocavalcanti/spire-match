import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),

  DATABASE_URL: z.string().min(1, "DATABASE_URL é obrigatório"),

  SESSION_COOKIE_NAME: z.string().default("spire_session"),
  SESSION_TTL_DAYS: z.coerce.number().int().positive().default(30),
  SESSION_COOKIE_SECURE: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),

  CORS_ALLOWED_ORIGINS: z
    .string()
    .default("http://localhost:3000,http://localhost:3001")
    .transform((v) => v.split(",").map((origin) => origin.trim())),

  // Fila assíncrona (Marco C) — Redis já provisionado no docker-compose
  // desde o Marco A. INTERNAL_API_KEY protege as rotas /internal/*, chamadas
  // só pelo apps/worker (nunca pelo navegador).
  REDIS_URL: z.string().default("redis://localhost:6379"),
  INTERNAL_API_KEY: z.string().min(16, "INTERNAL_API_KEY precisa ter pelo menos 16 caracteres"),

  // Pendências externas reais (ver docs/deployment/DEPLOY_HOSTINGER.md) —
  // ausentes em dev, nunca simuladas como ativas em produção.
  MAPTILER_API_KEY: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  SMTP_URL: z.string().optional(),
  WHATSAPP_CLOUD_API_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  LLM_PROVIDER_API_KEY: z.string().optional(),
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Variáveis de ambiente inválidas:\n${formatted}`);
  }
  return parsed.data;
}
