import { z } from "zod";

import { brokerSchema } from "./brokers";
import { propertySummarySchema } from "./property";

export const CONTACT_CHANNELS = ["WHATSAPP", "PLATFORM"] as const;
export const contactChannelSchema = z.enum(CONTACT_CHANNELS);
export type ContactChannel = z.infer<typeof contactChannelSchema>;

export const contactSchema = z.object({
  id: z.string().uuid(),
  propertyId: z.string().uuid(),
  property: propertySummarySchema,
  brokerId: z.string().uuid(),
  broker: brokerSchema,
  channel: contactChannelSchema,
  message: z.string(),
  createdAt: z.string().datetime(),
});
export type Contact = z.infer<typeof contactSchema>;

export const createContactRequestSchema = z.object({
  propertyId: z.string().uuid(),
  channel: contactChannelSchema,
  message: z.string().trim().min(1).max(1000),
});
export type CreateContactRequest = z.infer<typeof createContactRequestSchema>;
