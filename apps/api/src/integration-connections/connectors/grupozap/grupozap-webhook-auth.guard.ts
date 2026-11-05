import { type CanActivate, type ExecutionContext, Injectable, ServiceUnavailableException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Request } from "express";

import type { Env } from "../../../config/env";

/**
 * Autenticação do webhook de leads do Grupo ZAP/OLX: Basic Authentication
 * com uma SECRET_KEY única por CRM (nunca por anunciante) — exatamente como
 * documentado em developers.grupozap.com/webhooks/security.html. O usuário
 * no Base64 (ex.: "vivareal") identifica o remetente, mas só a comparação
 * da chave importa. Falha fechado: sem a env var configurada, responde 503
 * (nunca aceita sem poder validar a origem).
 */
@Injectable()
export class GrupoZapWebhookAuthGuard implements CanActivate {
  constructor(private readonly config: ConfigService<Env, true>) {}

  canActivate(context: ExecutionContext): boolean {
    const secretKey = this.config.get("GRUPOZAP_WEBHOOK_SECRET_KEY", { infer: true });
    if (!secretKey) {
      throw new ServiceUnavailableException({
        code: "GRUPOZAP_NOT_CONFIGURED",
        message: "Integração com Grupo ZAP/OLX ainda não está configurada (GRUPOZAP_WEBHOOK_SECRET_KEY ausente)",
      });
    }

    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith("Basic ")) {
      throw new UnauthorizedException({ code: "GRUPOZAP_AUTH_MISSING", message: "Cabeçalho Authorization ausente" });
    }

    const decoded = Buffer.from(authHeader.slice("Basic ".length), "base64").toString("utf8");
    const separatorIndex = decoded.indexOf(":");
    const providedKey = separatorIndex >= 0 ? decoded.slice(separatorIndex + 1) : decoded;

    if (providedKey !== secretKey) {
      throw new UnauthorizedException({ code: "GRUPOZAP_AUTH_INVALID", message: "Chave de segurança inválida" });
    }
    return true;
  }
}
