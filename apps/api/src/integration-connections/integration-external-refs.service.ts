import { Inject, Injectable } from "@nestjs/common";
import { and, eq } from "drizzle-orm";

import type { Database } from "../database/client";
import { DATABASE } from "../database/database.module";
import { integrationExternalRefs } from "../database/schema";

/**
 * Correspondência internalId ↔ externalId por conexão+tipo de entidade
 * (M1, bullet "correspondência entre identificadores internos e externos").
 * `entityType` é texto livre (ex.: "PROPERTY", "LEAD") — nenhum conector
 * concreto existe ainda, então não há lista fechada de tipos para validar.
 */
@Injectable()
export class IntegrationExternalRefsService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async resolveInternalId(connectionId: string, entityType: string, externalId: string): Promise<string | null> {
    const [row] = await this.db
      .select({ internalId: integrationExternalRefs.internalId })
      .from(integrationExternalRefs)
      .where(
        and(
          eq(integrationExternalRefs.connectionId, connectionId),
          eq(integrationExternalRefs.entityType, entityType),
          eq(integrationExternalRefs.externalId, externalId),
        ),
      )
      .limit(1);
    return row?.internalId ?? null;
  }

  async resolveExternalId(connectionId: string, entityType: string, internalId: string): Promise<string | null> {
    const [row] = await this.db
      .select({ externalId: integrationExternalRefs.externalId })
      .from(integrationExternalRefs)
      .where(
        and(
          eq(integrationExternalRefs.connectionId, connectionId),
          eq(integrationExternalRefs.entityType, entityType),
          eq(integrationExternalRefs.internalId, internalId),
        ),
      )
      .limit(1);
    return row?.externalId ?? null;
  }

  /** Upsert por (conexão, tipo, externalId) — chamado pelo conector concreto que vier a existir (M2+). */
  async link(connectionId: string, entityType: string, internalId: string, externalId: string): Promise<void> {
    await this.db
      .insert(integrationExternalRefs)
      .values({ connectionId, entityType, internalId, externalId })
      .onConflictDoUpdate({
        target: [integrationExternalRefs.connectionId, integrationExternalRefs.entityType, integrationExternalRefs.externalId],
        set: { internalId, updatedAt: new Date() },
      });
  }
}
