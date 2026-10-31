import { z } from "zod";

// Pulse (seção 4.11 do prompt mestre): indicadores de mercado só podem ser
// publicados com fonte, período e metodologia declarados — nunca um número
// sem proveniência. Todos os campos são obrigatórios de propósito.
export const marketIndicatorSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  value: z.number(),
  unit: z.string(),
  region: z.string(),
  period: z.string(),
  source: z.string(),
  methodology: z.string(),
  active: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type MarketIndicator = z.infer<typeof marketIndicatorSchema>;

export const createMarketIndicatorRequestSchema = z.object({
  title: z.string().trim().min(2).max(160),
  value: z.number(),
  unit: z.string().trim().min(1).max(40),
  region: z.string().trim().min(1).max(120),
  period: z.string().trim().min(1).max(60),
  source: z.string().trim().min(1).max(200),
  methodology: z.string().trim().min(1).max(2000),
  active: z.boolean().default(true),
});
export type CreateMarketIndicatorRequest = z.infer<typeof createMarketIndicatorRequestSchema>;

export const updateMarketIndicatorRequestSchema = createMarketIndicatorRequestSchema.partial();
export type UpdateMarketIndicatorRequest = z.infer<typeof updateMarketIndicatorRequestSchema>;
