import type { Lead, LeadActivity, LeadBuyer } from "@spire/contracts";
import { temperatureFromScore } from "@spire/domain";

import { toBroker } from "../brokers/broker-mapper";
import type { brokers, leadActivities, leads, properties, users } from "../database/schema";
import { toPropertySummary } from "../properties/property-mapper";

type LeadRow = typeof leads.$inferSelect;
type UserRow = typeof users.$inferSelect;
type PropertyRow = typeof properties.$inferSelect;
type BrokerRow = typeof brokers.$inferSelect;
type LeadActivityRow = typeof leadActivities.$inferSelect;

export function toLeadBuyer(row: UserRow): LeadBuyer {
  return { id: row.id, name: row.name, email: row.email, avatarUrl: row.avatarUrl };
}

export function toLead(
  row: LeadRow,
  buyer: UserRow,
  sourceProperty: PropertyRow | null,
  assignedBroker: BrokerRow | null,
): Lead {
  return {
    id: row.id,
    buyer: toLeadBuyer(buyer),
    sourceProperty: sourceProperty ? toPropertySummary(sourceProperty) : null,
    assignedBroker: assignedBroker ? toBroker(assignedBroker) : null,
    stage: row.stage,
    score: row.score,
    temperature: temperatureFromScore(row.score),
    wonAmount: row.wonAmount === null ? null : Number(row.wonAmount),
    lostReason: row.lostReason,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toLeadActivity(row: LeadActivityRow): LeadActivity {
  return {
    id: row.id,
    type: row.type,
    description: row.description,
    createdAt: row.createdAt.toISOString(),
  };
}
