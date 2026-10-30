import "dotenv/config";

import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  // URL base da API (apps/api) para os jobs chamarem de volta os endpoints
  // internos — em dev aponta para o processo local, em produção para o
  // serviço "api" dentro da rede do docker-compose.
  API_INTERNAL_URL: z.string().default("http://localhost:4000"),
  INTERNAL_API_KEY: z.string().min(16, "INTERNAL_API_KEY precisa ter pelo menos 16 caracteres"),
  RADAR_SWEEP_INTERVAL_MINUTES: z.coerce.number().int().positive().default(15),
});

export type WorkerEnv = z.infer<typeof envSchema>;

export function loadEnv(): WorkerEnv {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const formatted = parsed.error.issues.map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`).join("\n");
    throw new Error(`Variáveis de ambiente inválidas (apps/worker):\n${formatted}`);
  }
  return parsed.data;
}
