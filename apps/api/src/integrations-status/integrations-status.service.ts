import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { IntegrationStatusEntry } from "@spire/contracts";

import type { Env } from "../config/env";

@Injectable()
export class IntegrationsStatusService {
  constructor(private readonly config: ConfigService<Env, true>) {}

  private get<K extends keyof Env>(key: K): Env[K] {
    return this.config.get(key, { infer: true });
  }

  /**
   * Mostra o que está realmente configurado — nunca simula uma integração
   * como ativa só porque a feature existe no código. Cada pendência aqui
   * tem instruções em docs/deployment/PROVIDER_CONFIGURATION.md.
   */
  list(): IntegrationStatusEntry[] {
    const hasMapTilerKey = Boolean(this.get("MAPTILER_API_KEY"));
    const hasS3 = Boolean(this.get("S3_ENDPOINT") && this.get("S3_ACCESS_KEY_ID") && this.get("S3_SECRET_ACCESS_KEY") && this.get("S3_BUCKET"));
    const hasSmtp = Boolean(this.get("SMTP_URL"));
    const hasWhatsapp = Boolean(this.get("WHATSAPP_CLOUD_API_TOKEN") && this.get("WHATSAPP_PHONE_NUMBER_ID"));
    const hasLlm = Boolean(this.get("LLM_PROVIDER_API_KEY"));
    const hasWebPush = Boolean(this.get("VAPID_PUBLIC_KEY") && this.get("VAPID_PRIVATE_KEY"));

    return [
      {
        key: "maps",
        label: "Mapas",
        status: hasMapTilerKey ? "ATIVO" : "PENDENTE",
        description: hasMapTilerKey
          ? "Chave MapTiler configurada no backend."
          : "Sem MAPTILER_API_KEY — o mapa do comprador usa tiles OpenStreetMap brutos por padrão (decisão documentada em ADR); configure esta chave para trocar pelo provedor licenciado.",
      },
      {
        key: "storage",
        label: "Armazenamento (S3)",
        status: hasS3 ? "ATIVO" : "PENDENTE",
        description: hasS3 ? "Bucket S3-compatível configurado." : "Sem credenciais S3 — upload de mídia (fotos de imóveis) fica indisponível.",
      },
      {
        key: "smtp",
        label: "E-mail (SMTP)",
        status: hasSmtp ? "ATIVO" : "PENDENTE",
        description: hasSmtp ? "Provedor SMTP configurado." : "Sem SMTP_URL — e-mails transacionais (verificação, redefinição de senha) ficam pendentes, nunca simulados como enviados.",
      },
      {
        key: "whatsapp",
        label: "WhatsApp Business",
        status: hasWhatsapp ? "ATIVO" : "PENDENTE",
        description: hasWhatsapp ? "Token e número configurados." : "Sem credenciais do WhatsApp Business Cloud API — canal de notificação fica desligado.",
      },
      {
        key: "llm",
        label: "IA (AI Concierge)",
        status: hasLlm ? "ATIVO" : "PENDENTE",
        description: hasLlm ? "Provedor de LLM configurado." : "Sem LLM_PROVIDER_API_KEY — busca por IA usa o fallback determinístico por filtros, sempre disponível.",
      },
      {
        key: "webPush",
        label: "Notificações push",
        status: hasWebPush ? "ATIVO" : "PENDENTE",
        description: hasWebPush ? "Par de chaves VAPID configurado — não depende de credencial de terceiro." : "Sem par de chaves VAPID — notificações push do navegador ficam indisponíveis.",
      },
    ];
  }
}
