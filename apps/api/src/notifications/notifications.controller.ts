import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiTags } from "@nestjs/swagger";
import { notificationListQuerySchema, pushSubscriptionRequestSchema } from "@spire/contracts";

import { CurrentUserId } from "../auth/decorators/current-user-id.decorator";
import { SessionAuthGuard } from "../auth/guards/session-auth.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import type { Env } from "../config/env";

import { NotificationsService } from "./notifications.service";

@ApiTags("notifications")
@Controller("notifications")
export class NotificationsController {
  constructor(
    private readonly notifications: NotificationsService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  @Get("vapid-public-key")
  vapidPublicKey() {
    return { publicKey: this.config.get("VAPID_PUBLIC_KEY", { infer: true }) ?? null };
  }

  @Get()
  @UseGuards(SessionAuthGuard)
  async list(
    @CurrentUserId() userId: string,
    @Query(new ZodValidationPipe(notificationListQuerySchema)) query: ReturnType<typeof notificationListQuerySchema.parse>,
  ) {
    return this.notifications.listMine(userId, query);
  }

  @Get("unread-count")
  @UseGuards(SessionAuthGuard)
  async unreadCount(@CurrentUserId() userId: string) {
    const count = await this.notifications.unreadCount(userId);
    return { count };
  }

  @Post(":id/read")
  @UseGuards(SessionAuthGuard)
  async markRead(@CurrentUserId() userId: string, @Param("id") id: string) {
    await this.notifications.markRead(userId, id);
    return { read: true };
  }

  @Post("read-all")
  @UseGuards(SessionAuthGuard)
  async markAllRead(@CurrentUserId() userId: string) {
    await this.notifications.markAllRead(userId);
    return { read: true };
  }

  @Post("push/subscribe")
  @UseGuards(SessionAuthGuard)
  async subscribe(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(pushSubscriptionRequestSchema)) body: ReturnType<typeof pushSubscriptionRequestSchema.parse>,
  ) {
    await this.notifications.subscribePush(userId, body);
    return { subscribed: true };
  }

  @Delete("push/subscribe")
  @UseGuards(SessionAuthGuard)
  async unsubscribe(@Body() body: { endpoint: string }) {
    await this.notifications.unsubscribePush(body.endpoint);
    return { unsubscribed: true };
  }
}
