import { randomUUID } from "node:crypto";

import { Inject, Injectable, ServiceUnavailableException } from "@nestjs/common";
import { and, eq } from "drizzle-orm";

import { PasswordService } from "../../../auth/password.service";
import type { Database } from "../../../database/client";
import { DATABASE } from "../../../database/database.module";
import { integrationEvents, roleAssignments, roles, users } from "../../../database/schema";
import { LeadsService } from "../../../leads/leads.service";
import { IntegrationConnectionsService } from "../../integration-connections.service";
import { IntegrationEventsService } from "../../integration-events.service";
import { IntegrationExternalRefsService } from "../../integration-external-refs.service";

import { type GrupoZapLeadPayload, grupoZapLeadPayloadSchema } from "./grupozap-lead-payload.schema";

const PROVIDER = "GRUPOZAP";
const MAX_PENDING_PER_RUN = 50;

/**
 * Conector de leads do Grupo ZAP/OLX (ZAP Imóveis + Viva Real + OLX, mesmo
 * backend de leads — ver docs/product/NOVOS_RECURSOS_PROGRESSO.md). Usa a
 * fundação do M1 (`IntegrationEventsService`) para persistir/deduplicar cada
 * evento antes de processá-lo — um lead nunca se perde mesmo se a criação do
 * contato/lead falhar, porque o evento fica FALHOU e é reprocessado depois
 * (ver `processPendingEvents`, chamado por /internal/grupozap/process-pending-leads).
 */
@Injectable()
export class GrupoZapLeadsService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly connections: IntegrationConnectionsService,
    private readonly events: IntegrationEventsService,
    private readonly externalRefs: IntegrationExternalRefsService,
    private readonly leads: LeadsService,
    private readonly passwords: PasswordService,
  ) {}

  private async getConnectionOrThrow() {
    const connection = await this.connections.findByProvider(PROVIDER);
    if (!connection) {
      throw new ServiceUnavailableException({
        code: "GRUPOZAP_CONNECTION_MISSING",
        message: "Crie a conexão com provider \"GRUPOZAP\" em /admin/integracoes antes de usar este webhook.",
      });
    }
    return connection;
  }

  /**
   * Ponto de entrada do webhook — sempre persiste o payload cru primeiro,
   * antes de qualquer tentativa de interpretá-lo. Um lead "incompleto" (ex.:
   * sem e-mail, só com telefone — plausível para leadType PHONE_VIEW/
   * CLICK_WHATSAPP, não documentados com todos os campos garantidos) fica
   * salvo como evento FALHOU, nunca descartado silenciosamente.
   */
  async receiveLead(raw: Record<string, unknown>): Promise<{ duplicate: boolean; processed: boolean }> {
    const connection = await this.getConnectionOrThrow();

    const externalEventId = typeof raw.originLeadId === "string" ? raw.originLeadId : undefined;
    const { event, duplicate } = await this.events.ingest({
      connectionId: connection.id,
      direction: "ENTRADA",
      eventType: "LEAD_RECEIVED",
      payload: raw,
      externalEventId,
    });
    if (duplicate) return { duplicate: true, processed: event.status === "PROCESSADO" };

    const parsed = grupoZapLeadPayloadSchema.safeParse(raw);
    if (!parsed.success) {
      await this.events.markFailed(event.id, `Payload não reconhecido: ${parsed.error.message}`);
      return { duplicate: false, processed: false };
    }

    // Conexão PENDENTE/PAUSADA: o evento já está salvo (nunca se perde), só
    // não processa agora — reprocessa quando a conexão for ativada.
    if (connection.status !== "ATIVA") return { duplicate: false, processed: false };

    await this.processEvent(connection.id, event.id, parsed.data);
    return { duplicate: false, processed: true };
  }

  /** Busca por e-mail (normalizado) é a chave real de deduplicação de identidade — nunca cria duas contas para o mesmo e-mail. */
  private async resolveOrCreateUserId(name: string, email: string): Promise<string> {
    const normalizedEmail = email.trim().toLowerCase();
    const [existing] = await this.db.select({ id: users.id }).from(users).where(eq(users.email, normalizedEmail)).limit(1);
    if (existing) return existing.id;

    // Senha aleatória e descartada — nenhum fluxo de login usa este hash; a
    // conta só existe para satisfazer leads.user_id até a pessoa se
    // cadastrar de verdade (mesmo e-mail) ou um fluxo de "reivindicar conta"
    // futuro existir (gap documentado, não resolvido nesta fatia).
    const passwordHash = await this.passwords.hash(randomUUID());
    const [created] = await this.db.insert(users).values({ name, email: normalizedEmail, passwordHash }).returning();
    if (!created) throw new Error("Falha ao criar usuário a partir de lead externo");

    const [buyerRole] = await this.db.select().from(roles).where(eq(roles.name, "BUYER")).limit(1);
    if (buyerRole) await this.db.insert(roleAssignments).values({ userId: created.id, roleId: buyerRole.id });

    return created.id;
  }

  /** Só resolve se M5 (publicação) já tiver registrado o mapeamento property↔clientListingId — honesto: null até lá. */
  private async resolveSourcePropertyId(connectionId: string, payload: GrupoZapLeadPayload): Promise<string | undefined> {
    if (!payload.clientListingId) return undefined;
    const internalId = await this.externalRefs.resolveInternalId(connectionId, "PROPERTY", payload.clientListingId);
    return internalId ?? undefined;
  }

  async processEvent(connectionId: string, eventId: string, payload: GrupoZapLeadPayload): Promise<void> {
    try {
      const userId = await this.resolveOrCreateUserId(payload.name, payload.email);
      const sourcePropertyId = await this.resolveSourcePropertyId(connectionId, payload);

      const originLabel = payload.leadOrigin === "MCMV_OLX" ? "Minha Casa Minha Vida (OLX)" : payload.leadOrigin;
      const description = payload.message ? `Lead recebido via ${originLabel}: "${payload.message}"` : `Lead recebido via ${originLabel}.`;

      await this.leads.recordSignal(userId, "INTEGRATION_LEAD_RECEIVED", description, sourcePropertyId);
      await this.events.markProcessed(eventId);
      await this.connections.recordSync(connectionId);
    } catch (err) {
      await this.events.markFailed(eventId, (err as Error).message);
      throw err;
    }
  }

  /**
   * Reprocessa eventos LEAD_RECEIVED ainda PENDENTE desta conexão — chamado
   * pelo worker. Cobre tanto o caso de a conexão ter sido ativada depois do
   * recebimento quanto falhas transitórias já requeueadas por
   * `IntegrationEventsService.requeueFailed`.
   */
  async processPendingEvents(): Promise<number> {
    // Chamado pelo worker em ciclo fixo — se o admin ainda não criou a
    // conexão "GRUPOZAP", é um estado normal de "ainda não configurado", não
    // uma falha a ser logada a cada tick (mesma filosofia de
    // RadarsService.sweep: no-op silencioso quando não há nada a fazer).
    const connection = await this.connections.findByProvider(PROVIDER);
    if (!connection || connection.status !== "ATIVA") return 0;

    const pending = await this.db
      .select()
      .from(integrationEvents)
      .where(and(eq(integrationEvents.connectionId, connection.id), eq(integrationEvents.status, "PENDENTE"), eq(integrationEvents.eventType, "LEAD_RECEIVED")))
      .limit(MAX_PENDING_PER_RUN);

    let processed = 0;
    for (const row of pending) {
      const parsed = grupoZapLeadPayloadSchema.safeParse(row.payload);
      if (!parsed.success) {
        await this.events.markFailed(row.id, `Payload armazenado inválido: ${parsed.error.message}`);
        continue;
      }
      try {
        await this.processEvent(connection.id, row.id, parsed.data);
        processed += 1;
      } catch {
        // já marcado FALHOU dentro de processEvent — segue para o próximo item do lote
      }
    }
    return processed;
  }
}
