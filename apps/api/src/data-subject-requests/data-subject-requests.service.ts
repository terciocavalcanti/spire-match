import { Inject, Injectable, NotFoundException, UnprocessableEntityException } from "@nestjs/common";
import type { CreateDataSubjectRequestRequest, DataSubjectRequest, ResolveDataSubjectRequestRequest } from "@spire/contracts";
import { desc, eq } from "drizzle-orm";

import { AuditLogService } from "../audit/audit-log.service";
import { SessionService } from "../auth/session.service";
import type { Database } from "../database/client";
import { DATABASE } from "../database/database.module";
import {
  buyerProfiles,
  consents,
  contacts,
  dataSubjectRequests,
  favorites,
  leadActivities,
  leads,
  ownerLeadActivities,
  ownerLeads,
  proposals,
  users,
  visits,
} from "../database/schema";

function toDataSubjectRequest(row: typeof dataSubjectRequests.$inferSelect, user: { name: string; email: string }): DataSubjectRequest {
  return {
    id: row.id,
    userId: row.userId,
    userName: user.name,
    userEmail: user.email,
    type: row.type,
    status: row.status,
    requestedAt: row.requestedAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
    handledByUserId: row.handledByUserId,
    rejectionReason: row.rejectionReason,
  };
}

@Injectable()
export class DataSubjectRequestsService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly sessions: SessionService,
    private readonly auditLog: AuditLogService,
  ) {}

  /**
   * Monta o export real dos dados do próprio titular — mesmas tabelas que o
   * resto da API já lê, nada inventado. Cobre as categorias principais de
   * dado pessoal que a plataforma guarda hoje (ver docs/security/LGPD_DATA_MAP.md).
   */
  private async buildExport(userId: string) {
    const [user] = await this.db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) throw new NotFoundException({ code: "USER_NOT_FOUND", message: "Usuário não encontrado" });

    const [profile, buyerPreferences, favoriteRows, contactRows, visitRows, proposalRows, consentRows, lead, ownerLeadRows] = await Promise.all([
      Promise.resolve({ id: user.id, name: user.name, email: user.email, createdAt: user.createdAt, emailVerifiedAt: user.emailVerifiedAt }),
      this.db.select().from(buyerProfiles).where(eq(buyerProfiles.userId, userId)).limit(1),
      this.db.select().from(favorites).where(eq(favorites.userId, userId)),
      this.db.select().from(contacts).where(eq(contacts.userId, userId)),
      this.db.select().from(visits).where(eq(visits.userId, userId)),
      this.db.select().from(proposals).where(eq(proposals.userId, userId)),
      this.db.select().from(consents).where(eq(consents.userId, userId)),
      this.db.select().from(leads).where(eq(leads.userId, userId)).limit(1),
      this.db.select().from(ownerLeads).where(eq(ownerLeads.userId, userId)),
    ]);

    let leadActivityRows: (typeof leadActivities.$inferSelect)[] = [];
    if (lead[0]) {
      leadActivityRows = await this.db.select().from(leadActivities).where(eq(leadActivities.leadId, lead[0].id));
    }
    const ownerLeadActivityRows = await Promise.all(
      ownerLeadRows.map((ol) => this.db.select().from(ownerLeadActivities).where(eq(ownerLeadActivities.ownerLeadId, ol.id))),
    );

    return {
      geradoEm: new Date().toISOString(),
      perfil: profile,
      preferenciasDeComprador: buyerPreferences[0] ?? null,
      favoritos: favoriteRows,
      contatos: contactRows,
      visitas: visitRows,
      propostas: proposalRows,
      consentimentos: consentRows,
      leadComercial: lead[0] ?? null,
      atividadesDoLead: leadActivityRows,
      captacoesComoProprietario: ownerLeadRows.map((ol, i) => ({ ...ol, atividades: ownerLeadActivityRows[i] })),
    };
  }

  async create(userId: string, request: CreateDataSubjectRequestRequest): Promise<{ request: DataSubjectRequest; exportData: unknown | null }> {
    const [user] = await this.db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) throw new NotFoundException({ code: "USER_NOT_FOUND", message: "Usuário não encontrado" });

    if (request.type === "EXPORTACAO") {
      const exportData = await this.buildExport(userId);
      const [row] = await this.db
        .insert(dataSubjectRequests)
        .values({ userId, type: "EXPORTACAO", status: "CONCLUIDO", completedAt: new Date() })
        .returning();
      await this.auditLog.record({ actorUserId: userId, action: "data_subject_request.exported", entityType: "data_subject_request", entityId: row!.id });
      return { request: toDataSubjectRequest(row!, user), exportData };
    }

    const [row] = await this.db.insert(dataSubjectRequests).values({ userId, type: "EXCLUSAO" }).returning();
    await this.auditLog.record({ actorUserId: userId, action: "data_subject_request.deletion_requested", entityType: "data_subject_request", entityId: row!.id });
    return { request: toDataSubjectRequest(row!, user), exportData: null };
  }

  async listMine(userId: string): Promise<DataSubjectRequest[]> {
    const [user] = await this.db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) throw new NotFoundException({ code: "USER_NOT_FOUND", message: "Usuário não encontrado" });
    const rows = await this.db.select().from(dataSubjectRequests).where(eq(dataSubjectRequests.userId, userId)).orderBy(desc(dataSubjectRequests.requestedAt));
    return rows.map((r) => toDataSubjectRequest(r, user));
  }

  async list(): Promise<DataSubjectRequest[]> {
    const rows = await this.db
      .select({ request: dataSubjectRequests, user: users })
      .from(dataSubjectRequests)
      .innerJoin(users, eq(users.id, dataSubjectRequests.userId))
      .orderBy(desc(dataSubjectRequests.requestedAt));
    return rows.map((r) => toDataSubjectRequest(r.request, r.user));
  }

  /**
   * Único consumidor real de users.status=DELETED/users.deletedAt hoje —
   * anonimiza o titular (mantém o id e as linhas históricas, que viram
   * não-identificáveis) e revoga a sessão, mesmo padrão de
   * AdminUsersService.setStatus("SUSPENDED").
   */
  async resolve(id: string, request: ResolveDataSubjectRequestRequest, actorUserId: string): Promise<DataSubjectRequest> {
    const [row] = await this.db.select().from(dataSubjectRequests).where(eq(dataSubjectRequests.id, id)).limit(1);
    if (!row) throw new NotFoundException({ code: "REQUEST_NOT_FOUND", message: "Solicitação não encontrada" });
    if (row.status !== "PENDENTE") {
      throw new UnprocessableEntityException({ code: "ALREADY_RESOLVED", message: "Esta solicitação já foi resolvida" });
    }
    if (request.status === "REJEITADO" && !request.rejectionReason) {
      throw new UnprocessableEntityException({ code: "REJECTION_REASON_REQUIRED", message: "Informe o motivo da rejeição" });
    }

    const [user] = await this.db.select().from(users).where(eq(users.id, row.userId)).limit(1);
    if (!user) throw new NotFoundException({ code: "USER_NOT_FOUND", message: "Usuário não encontrado" });

    if (request.status === "CONCLUIDO" && row.type === "EXCLUSAO") {
      await this.db
        .update(users)
        .set({
          name: "Usuário excluído",
          email: `excluido+${row.userId}@valorimatch.internal`,
          avatarUrl: null,
          status: "DELETED",
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, row.userId));
      await this.sessions.revokeAllForUser(row.userId);
    }

    await this.db
      .update(dataSubjectRequests)
      .set({
        status: request.status,
        completedAt: new Date(),
        handledByUserId: actorUserId,
        rejectionReason: request.status === "REJEITADO" ? (request.rejectionReason ?? null) : null,
      })
      .where(eq(dataSubjectRequests.id, id));

    await this.auditLog.record({
      actorUserId,
      action: `data_subject_request.${request.status === "CONCLUIDO" ? "deletion_confirmed" : "deletion_rejected"}`,
      entityType: "data_subject_request",
      entityId: id,
      metadata: { targetUserId: row.userId, rejectionReason: request.rejectionReason ?? null },
    });

    const [updated] = await this.db.select().from(dataSubjectRequests).where(eq(dataSubjectRequests.id, id)).limit(1);
    return toDataSubjectRequest(updated!, user);
  }
}
