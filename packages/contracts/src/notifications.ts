import { z } from "zod";

export const NOTIFICATION_TYPES = [
  "MATCH_NEW",
  "PRICE_DROP",
  "VISIT_CONFIRMED",
  "VISIT_REMINDER",
  "PROPOSAL_UPDATE",
  "RADAR_HIT",
  "EXCLUSIVE_NEW",
  "SYSTEM",
] as const;
export const notificationTypeSchema = z.enum(NOTIFICATION_TYPES);
export type NotificationType = z.infer<typeof notificationTypeSchema>;

export const notificationSchema = z.object({
  id: z.string().uuid(),
  type: notificationTypeSchema,
  title: z.string(),
  body: z.string(),
  linkUrl: z.string().nullable(),
  readAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});
export type Notification = z.infer<typeof notificationSchema>;

export const notificationListQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(30),
  unreadOnly: z.coerce.boolean().optional(),
});
export type NotificationListQuery = z.infer<typeof notificationListQuerySchema>;

// Chaves VAPID públicas: identificam o servidor de aplicação perante o
// serviço de push do navegador (Push API/W3C) — não dependem de nenhum
// provedor terceiro nem exigem credencial externa paga, diferente de
// e-mail/WhatsApp/LLM. Por isso Web Push pode ser 100% real desde já.
export const pushSubscriptionRequestSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});
export type PushSubscriptionRequest = z.infer<typeof pushSubscriptionRequestSchema>;
