import type { CampaignStats } from "@spire/contracts";
import { eq, inArray } from "drizzle-orm";

import type { Database } from "../database/client";
import { leads, units } from "../database/schema";

/**
 * Estatísticas de um empreendimento — nunca de uma campanha isolada, porque
 * não existe atribuição de lead por campanha (exigiria UTM/tracking que não
 * existe hoje). Honesto-zerado quando nenhuma unidade do empreendimento
 * está vinculada a um imóvel do catálogo (units.propertyId).
 */
export async function computeDevelopmentStats(db: Database, developmentId: string): Promise<CampaignStats> {
  const linkedUnits = await db
    .select({ propertyId: units.propertyId })
    .from(units)
    .where(eq(units.developmentId, developmentId));
  const propertyIds = linkedUnits.map((u) => u.propertyId).filter((id): id is string => id !== null);

  if (propertyIds.length === 0) {
    return { leadsCount: 0, wonCount: 0, vgv: 0, linkedPropertiesCount: 0 };
  }

  const relatedLeads = await db
    .select({ stage: leads.stage, wonAmount: leads.wonAmount })
    .from(leads)
    .where(inArray(leads.sourcePropertyId, propertyIds));

  const wonLeads = relatedLeads.filter((l) => l.stage === "GANHO");

  return {
    leadsCount: relatedLeads.length,
    wonCount: wonLeads.length,
    vgv: wonLeads.reduce((sum, l) => sum + (l.wonAmount ? Number(l.wonAmount) : 0), 0),
    linkedPropertiesCount: new Set(propertyIds).size,
  };
}
