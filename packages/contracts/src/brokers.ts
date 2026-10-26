import { z } from "zod";

export const brokerSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().nullable(),
  avatarUrl: z.string().url().nullable(),
  bio: z.string(),
  creci: z.string().nullable(),
});
export type Broker = z.infer<typeof brokerSchema>;

// --- Administração (CRUD de corretores, Marco D) ---
export const createBrokerRequestSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email(),
  phone: z.string().trim().max(30).nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
  bio: z.string().trim().max(2000).default(""),
  creci: z.string().trim().max(60).nullable().optional(),
});
export type CreateBrokerRequest = z.infer<typeof createBrokerRequestSchema>;

export const updateBrokerRequestSchema = createBrokerRequestSchema.partial();
export type UpdateBrokerRequest = z.infer<typeof updateBrokerRequestSchema>;
