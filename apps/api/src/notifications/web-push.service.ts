import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import webpush from "web-push";

import type { Env } from "../config/env";

export interface WebPushSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

/**
 * Web Push (W3C Push API + VAPID) — ao contrário de e-mail/WhatsApp/LLM, não
 * depende de credencial de nenhum provedor terceiro: o par de chaves VAPID é
 * gerado localmente (identifica o servidor perante o serviço de push do
 * navegador). Por isso esta integração é real desde já, não um adapter
 * gated — basta `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY` estarem configuradas.
 */
@Injectable()
export class WebPushService {
  private readonly logger = new Logger(WebPushService.name);
  private readonly configured: boolean;

  constructor(config: ConfigService<Env, true>) {
    const publicKey = config.get("VAPID_PUBLIC_KEY", { infer: true });
    const privateKey = config.get("VAPID_PRIVATE_KEY", { infer: true });
    this.configured = Boolean(publicKey && privateKey);

    if (this.configured) {
      webpush.setVapidDetails("mailto:contato@spirematch.com.br", publicKey!, privateKey!);
    } else {
      this.logger.warn("VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY não configuradas — Web Push desativado.");
    }
  }

  get isConfigured(): boolean {
    return this.configured;
  }

  /** @returns `true` se a assinatura expirou/foi revogada (410/404) e deve ser removida pelo chamador. */
  async send(subscription: WebPushSubscription, payload: { title: string; body: string; url?: string }): Promise<{ expired: boolean }> {
    if (!this.configured) return { expired: false };
    try {
      await webpush.sendNotification(subscription, JSON.stringify(payload));
      return { expired: false };
    } catch (error) {
      const statusCode = (error as { statusCode?: number }).statusCode;
      if (statusCode === 404 || statusCode === 410) {
        return { expired: true };
      }
      this.logger.error(`Falha ao enviar web push: ${(error as Error).message}`);
      return { expired: false };
    }
  }
}
