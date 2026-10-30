import { createHash, randomBytes } from "node:crypto";

import { ConflictException, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { AuthenticatedUser, LoginRequest, RegisterRequest, Role } from "@spire/contracts";
import { eq } from "drizzle-orm";


import type { Env } from "../config/env";
import type { Database } from "../database/client";
import { DATABASE } from "../database/database.module";
import { emailVerifications, passwordResetTokens, roleAssignments, roles, users } from "../database/schema";

import { PasswordService } from "./password.service";
import { SessionService } from "./session.service";

export interface AuthResult {
  user: AuthenticatedUser;
  session: { rawToken: string; expiresAt: Date };
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly passwords: PasswordService,
    private readonly sessions: SessionService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async register(
    payload: RegisterRequest,
    meta: { userAgent?: string; ipAddress?: string },
  ): Promise<AuthResult> {
    const [existing] = await this.db.select({ id: users.id }).from(users).where(eq(users.email, payload.email)).limit(1);
    if (existing) {
      throw new ConflictException({
        code: "EMAIL_ALREADY_REGISTERED",
        message: "Já existe uma conta com este e-mail",
      });
    }

    const passwordHash = await this.passwords.hash(payload.password);
    const [created] = await this.db
      .insert(users)
      .values({ name: payload.name, email: payload.email, passwordHash })
      .returning();
    if (!created) throw new Error("Falha ao criar usuário");

    const [buyerRole] = await this.db.select().from(roles).where(eq(roles.name, "BUYER")).limit(1);
    if (buyerRole) {
      await this.db.insert(roleAssignments).values({ userId: created.id, roleId: buyerRole.id });
    }

    // Token de verificação de e-mail emitido mas envio real depende do
    // NotificationOrchestrator (Marco C) — por ora fica pendente/registrado.
    const verificationToken = randomBytes(24).toString("base64url");
    await this.db.insert(emailVerifications).values({
      userId: created.id,
      tokenHash: createHash("sha256").update(verificationToken).digest("hex"),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const ttlDays = this.config.get("SESSION_TTL_DAYS", { infer: true });
    const session = await this.sessions.create(created.id, ttlDays, meta);
    const user = await this.toAuthenticatedUser(created.id);
    return { user, session };
  }

  async login(payload: LoginRequest, meta: { userAgent?: string; ipAddress?: string }): Promise<AuthResult> {
    const [found] = await this.db.select().from(users).where(eq(users.email, payload.email)).limit(1);
    if (!found || found.status !== "ACTIVE") {
      throw new UnauthorizedException({ code: "INVALID_CREDENTIALS", message: "E-mail ou senha incorretos" });
    }

    const valid = await this.passwords.verify(found.passwordHash, payload.password);
    if (!valid) {
      throw new UnauthorizedException({ code: "INVALID_CREDENTIALS", message: "E-mail ou senha incorretos" });
    }

    const ttlDays = payload.rememberMe ? this.config.get("SESSION_TTL_DAYS", { infer: true }) : 1;
    const session = await this.sessions.create(found.id, ttlDays, meta);
    const user = await this.toAuthenticatedUser(found.id);
    return { user, session };
  }

  async logout(rawToken: string): Promise<void> {
    await this.sessions.revoke(rawToken);
  }

  async requestPasswordReset(email: string): Promise<void> {
    const [found] = await this.db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    // Resposta sempre neutra (não revela se o e-mail existe), mas só gera
    // token quando o usuário realmente existe.
    if (!found) return;

    const token = randomBytes(24).toString("base64url");
    await this.db.insert(passwordResetTokens).values({
      userId: found.id,
      tokenHash: createHash("sha256").update(token).digest("hex"),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });
    // Envio real do e-mail fica pendente do provedor SMTP configurado (Marco C).
  }

  async resetPassword(rawToken: string, newPassword: string): Promise<void> {
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const [tokenRow] = await this.db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.tokenHash, tokenHash))
      .limit(1);

    if (!tokenRow || tokenRow.usedAt || tokenRow.expiresAt < new Date()) {
      throw new UnauthorizedException({ code: "INVALID_RESET_TOKEN", message: "Token de redefinição inválido ou expirado" });
    }

    const passwordHash = await this.passwords.hash(newPassword);
    await this.db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, tokenRow.userId));
    await this.db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, tokenRow.id));
  }

  async verifyEmail(rawToken: string): Promise<void> {
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const [tokenRow] = await this.db
      .select()
      .from(emailVerifications)
      .where(eq(emailVerifications.tokenHash, tokenHash))
      .limit(1);

    if (!tokenRow || tokenRow.verifiedAt || tokenRow.expiresAt < new Date()) {
      throw new UnauthorizedException({
        code: "INVALID_VERIFICATION_TOKEN",
        message: "Link de verificação inválido ou expirado",
      });
    }

    await this.db.update(users).set({ emailVerifiedAt: new Date(), updatedAt: new Date() }).where(eq(users.id, tokenRow.userId));
    await this.db
      .update(emailVerifications)
      .set({ verifiedAt: new Date() })
      .where(eq(emailVerifications.id, tokenRow.id));
  }

  async toAuthenticatedUser(userId: string): Promise<AuthenticatedUser> {
    const [user] = await this.db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) throw new UnauthorizedException({ code: "SESSION_INVALID", message: "Sessão inválida" });

    const assignedRoles = await this.db
      .select({ name: roles.name })
      .from(roleAssignments)
      .innerJoin(roles, eq(roles.id, roleAssignments.roleId))
      .where(eq(roleAssignments.userId, user.id));

    const roleNames = assignedRoles.map((r) => r.name) as Role[];

    // Métrica real sobre dados hoje existentes; será estendida com buyer_profiles no Marco B.
    const completenessChecks = [
      Boolean(user.name),
      Boolean(user.emailVerifiedAt),
      Boolean(user.avatarUrl),
      roleNames.length > 0,
    ];
    const profileCompleteness = Math.round(
      (completenessChecks.filter(Boolean).length / completenessChecks.length) * 100,
    );

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
      roles: roleNames,
      avatarUrl: user.avatarUrl,
      profileCompleteness,
      mustChangePassword: user.mustChangePassword,
      createdAt: user.createdAt.toISOString(),
    };
  }

  /** Troca de senha autenticada — exige a senha atual mesmo com sessão válida (defesa extra contra cookie roubado). */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const [user] = await this.db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) throw new UnauthorizedException({ code: "SESSION_INVALID", message: "Sessão inválida" });

    const valid = await this.passwords.verify(user.passwordHash, currentPassword);
    if (!valid) {
      throw new UnauthorizedException({ code: "INVALID_CURRENT_PASSWORD", message: "Senha atual incorreta" });
    }

    const passwordHash = await this.passwords.hash(newPassword);
    await this.db
      .update(users)
      .set({ passwordHash, mustChangePassword: false, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }
}
