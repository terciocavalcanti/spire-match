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
