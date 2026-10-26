import type { Notification } from "@spire/contracts";

import type { notifications } from "../database/schema";

type NotificationRow = typeof notifications.$inferSelect;

export function toNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    linkUrl: row.linkUrl,
    readAt: row.readAt ? row.readAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}
