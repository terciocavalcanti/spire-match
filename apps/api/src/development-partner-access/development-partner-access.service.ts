import { Inject, Injectable, NotFoundException, UnprocessableEntityException } from "@nestjs/common";
import type { DevelopmentPartnerAccess, GrantDevelopmentPartnerAccessRequest, MyDevelopmentPartnerAccess } from "@spire/contracts";
import { and, eq } from "drizzle-orm";

import { AuditLogService } from "../audit/audit-log.service";
import { computeDevelopmentStats } from "../campaigns/development-stats";
import type { Database } from "../database/client";
import { DATABASE } from "../database/database.module";
import { developmentPartnerAccess, developments, roleAssignments, roles, users } from "../database/schema";

@Injectable()
export class DevelopmentPartnerAccessService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly auditLog: AuditLogService,
  ) {}

  async list(): Promise<DevelopmentPartnerAccess[]> {
    const rows = await this.db
      .select({ access: developmentPartnerAccess, development: developments, user: users })
      .from(developmentPartnerAccess)
      .innerJoin(developments, eq(developments.id, developmentPartnerAccess.developmentId))
      .innerJoin(users, eq(users.id, developmentPartnerAccess.userId));

    return rows.map((r) => ({
      id: r.access.id,
      developmentId: r.development.id,
      developmentName: r.development.name,
      userId: r.user.id,
      userName: r.user.name,
      userEmail: r.user.email,
      grantedAt: r.access.grantedAt.toISOString(),
    }));
  }

  async grant(request: GrantDevelopmentPartnerAccessRequest, grantedByUserId: string): Promise<DevelopmentPartnerAccess> {
    const [development] = await this.db.select().from(developments).where(eq(developments.id, request.developmentId)).limit(1);
    if (!development) throw new NotFoundException({ code: "DEVELOPMENT_NOT_FOUND", message: "Empreendimento não encontrado" });

    const [user] = await this.db.select().from(users).where(eq(users.id, request.userId)).limit(1);
    if (!user) throw new NotFoundException({ code: "USER_NOT_FOUND", message: "Usuário não encontrado" });

    const [hasPartnerRole] = await this.db
      .select({ id: roleAssignments.id })
      .from(roleAssignments)
      .innerJoin(roles, eq(roles.id, roleAssignments.roleId))
      .where(and(eq(roleAssignments.userId, request.userId), eq(roles.name, "DEVELOPER_PARTNER")))
      .limit(1);
    if (!hasPartnerRole) {
      throw new UnprocessableEntityException({
        code: "USER_LACKS_DEVELOPER_PARTNER_ROLE",
        message: "O usuário precisa ter o papel Incorporadora atribuído em Usuários antes de receber acesso",
      });
    }

    const [row] = await this.db
      .insert(developmentPartnerAccess)
      .values({ developmentId: request.developmentId, userId: request.userId, grantedByUserId })
      .onConflictDoNothing({ target: [developmentPartnerAccess.developmentId, developmentPartnerAccess.userId] })
      .returning();

    const access = row ?? (await this.db
      .select()
      .from(developmentPartnerAccess)
      .where(and(eq(developmentPartnerAccess.developmentId, request.developmentId), eq(developmentPartnerAccess.userId, request.userId)))
      .limit(1))[0];
    if (!access) throw new Error("Falha ao conceder acesso");

    await this.auditLog.record({
      actorUserId: grantedByUserId,
      action: "development_partner_access.granted",
      entityType: "development_partner_access",
      entityId: access.id,
      metadata: { developmentId: development.id, userId: user.id },
    });

    return {
      id: access.id,
      developmentId: development.id,
      developmentName: development.name,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      grantedAt: access.grantedAt.toISOString(),
    };
  }

  async revoke(id: string, actorUserId: string): Promise<void> {
    const [access] = await this.db.select().from(developmentPartnerAccess).where(eq(developmentPartnerAccess.id, id)).limit(1);
    if (!access) throw new NotFoundException({ code: "ACCESS_NOT_FOUND", message: "Acesso não encontrado" });
    await this.db.delete(developmentPartnerAccess).where(eq(developmentPartnerAccess.id, id));
    await this.auditLog.record({
      actorUserId,
      action: "development_partner_access.revoked",
      entityType: "development_partner_access",
      entityId: id,
      metadata: { developmentId: access.developmentId, userId: access.userId },
    });
  }

  async listMine(userId: string): Promise<MyDevelopmentPartnerAccess[]> {
    const rows = await this.db
      .select({ access: developmentPartnerAccess, development: developments })
      .from(developmentPartnerAccess)
      .innerJoin(developments, eq(developments.id, developmentPartnerAccess.developmentId))
      .where(eq(developmentPartnerAccess.userId, userId));

    return Promise.all(
      rows.map(async (r) => ({
        developmentId: r.development.id,
        developmentName: r.development.name,
        developmentSlug: r.development.slug,
        stats: await computeDevelopmentStats(this.db, r.development.id),
      })),
    );
  }
}
