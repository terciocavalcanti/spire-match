import { type CanActivate, type ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Request } from "express";

import type { Env } from "../../config/env";
import { SessionService } from "../session.service";

export interface AuthenticatedRequest extends Request {
  userId: string;
}

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(
    private readonly sessions: SessionService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const cookieName = this.config.get("SESSION_COOKIE_NAME", { infer: true });
    const rawToken = request.cookies?.[cookieName];

    if (!rawToken) {
      throw new UnauthorizedException({ code: "UNAUTHENTICATED", message: "Sessão não encontrada" });
    }

    const userId = await this.sessions.findUserIdByToken(rawToken);
    if (!userId) {
      throw new UnauthorizedException({ code: "SESSION_EXPIRED", message: "Sessão expirada ou inválida" });
    }

    request.userId = userId;
    return true;
  }
}
