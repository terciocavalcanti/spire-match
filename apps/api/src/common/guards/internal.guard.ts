import { type CanActivate, type ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Request } from "express";

import type { Env } from "../../config/env";

/**
 * Protege as rotas /internal/* — chamadas só por apps/worker (nunca pelo
 * navegador), autenticadas por um segredo compartilhado via header, não por
 * sessão de usuário. Falha fechado: sem o header correto, nada passa.
 */
@Injectable()
export class InternalGuard implements CanActivate {
  constructor(private readonly config: ConfigService<Env, true>) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const provided = request.headers["x-internal-key"];
    const expected = this.config.get("INTERNAL_API_KEY", { infer: true });

    if (provided !== expected) {
      throw new UnauthorizedException({ code: "INTERNAL_KEY_INVALID", message: "Chave interna inválida" });
    }
    return true;
  }
}
