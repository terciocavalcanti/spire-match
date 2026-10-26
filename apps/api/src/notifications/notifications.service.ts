import { Inject, Injectable, Logger } from "@nestjs/common";
import type { Notification, NotificationListQuery, NotificationType, PushSubscriptionRequest } from "@spire/contracts";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";

import type { Database } from "../database/client";
import { DATABASE } from "../database/database.module";
import { notifications, pushSubscriptions } from "../database/schema";

import { toNotification } from "./notification-mapper";
import { WebPushService } from "./web-push.service";

function decodeCursor(cursor: string | undefined): number {
  if (!cursor) return 0;
  const decoded = Number(Buffer.from(cursor, "base64url").toString("utf8"));
  return Number.isFinite(decoded) && decoded >= 0 ? decoded : 0;
}

function encodeCursor(offset: number): string {
  return Buffer.from(String(offset), "utf8").toString("base64url");
}

/**
 * Orquestrador de notificações (NotificationOrchestrator): hoje grava o
 * inbox real no banco e envia Web Push real (sem credencial externa — ver
 * WebPushService). E-mail/WhatsApp ficam como adapters desligados até haver
 * SMTP_URL/WHATSAPP_CLOUD_API_TOKEN reais — nunca simulados como enviados.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly webPush: WebPushService,
  ) {}

  async notify(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    linkUrl?: string,
  ): Promise<Notification> {
    const [row] = await this.db
      .insert(notifications)
      .values({ userId, type, title, body, linkUrl: linkUrl ?? null })
      .returning();
    if (!row) throw new Error("Falha ao criar notificação");

    void this.dispatchPush(userId, title, body, linkUrl);

    return toNotification(row);
  }

  private async dispatchPush(userId: string, title: string, body: string, url?: string): Promise<void> {
    if (!this.webPush.isConfigured) return;
    const subs = await this.db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
    const expiredEndpoints: string[] = [];

    await Promise.all(
      subs.map(async (sub) => {
        const result = await this.webPush.send(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          { title, body, url },
        );
        if (result.expired) expiredEndpoints.push(sub.endpoint);
      }),
    );

    if (expiredEndpoints.length > 0) {
      await this.db.delete(pushSubscriptions).where(inArray(pushSubscriptions.endpoint, expiredEndpoints));
      this.logger.log(`Removidas ${expiredEndpoints.length} assinaturas push expiradas.`);
    }
  }

  async listMine(userId: string, query: NotificationListQuery): Promise<{ items: Notification[]; nextCursor: string | null }> {
    const offset = decodeCursor(query.cursor);
    const conditions = [eq(notifications.userId, userId)];
    if (query.unreadOnly) conditions.push(isNull(notifications.readAt));

    const rows = await this.db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(query.limit + 1)
      .offset(offset);

    const hasMore = rows.length > query.limit;
    const pageRows = hasMore ? rows.slice(0, query.limit) : rows;

    return {
      items: pageRows.map(toNotification),
      nextCursor: hasMore ? encodeCursor(offset + query.limit) : null,
    };
  }

  async unreadCount(userId: string): Promise<number> {
    const rows = await this.db
      .select({ id: notifications.id })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
    return rows.length;
  }

  async markRead(userId: string, id: string): Promise<void> {
    await this.db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
  }

  async markAllRead(userId: string): Promise<void> {
    await this.db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  }

  async subscribePush(userId: string, payload: PushSubscriptionRequest): Promise<void> {
    await this.db
      .insert(pushSubscriptions)
      .values({ userId, endpoint: payload.endpoint, p256dh: payload.keys.p256dh, auth: payload.keys.auth })
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: { userId, p256dh: payload.keys.p256dh, auth: payload.keys.auth },
      });
  }

  async unsubscribePush(endpoint: string): Promise<void> {
    await this.db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
  }
}
