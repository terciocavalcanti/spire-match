import { type CanActivate, type ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Request } from "express";

import type { Env } from "../../config/env";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Defesa CSRF de base para rotas autenticadas por cookie: em requisições
 * mutáveis, o header Origin (enviado pelo browser em toda requisição
 * cross-site) precisa bater com uma origem permitida. Combinado com cookies
 * SameSite=Lax. Um fluxo de token CSRF dedicado (double-submit) fica
 * reservado para o hardening do Marco F caso a superfície de ataque cresça.
 */
@Injectable()
export class OriginGuard implements CanActivate {
  constructor(private readonly config: ConfigService<Env, true>) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    if (!MUTATING_METHODS.has(request.method)) return true;

    const origin = request.headers.origin;
    if (!origin) return true; // requisições same-origin sem fetch/XHR podem omitir Origin

    const allowed = this.config.get("CORS_ALLOWED_ORIGINS", { infer: true });
    if (!allowed.includes(origin)) {
      throw new ForbiddenException({ code: "ORIGIN_NOT_ALLOWED", message: "Origem não permitida" });
    }
    return true;
  }
}
