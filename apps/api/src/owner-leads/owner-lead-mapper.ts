import type { OwnerLead, OwnerLeadActivity, OwnerLeadOwner } from "@spire/contracts";

import { toBroker } from "../brokers/broker-mapper";
import type { brokers, ownerLeadActivities, ownerLeads, users } from "../database/schema";

type OwnerLeadRow = typeof ownerLeads.$inferSelect;
type UserRow = typeof users.$inferSelect;
type BrokerRow = typeof brokers.$inferSelect;
type OwnerLeadActivityRow = typeof ownerLeadActivities.$inferSelect;

export function toOwnerLeadOwner(row: UserRow): OwnerLeadOwner {
  return { id: row.id, name: row.name, email: row.email, avatarUrl: row.avatarUrl };
}

export function toOwnerLead(row: OwnerLeadRow, owner: UserRow, assignedBroker: BrokerRow | null): OwnerLead {
  return {
    id: row.id,
    owner: toOwnerLeadOwner(owner),
    assignedBroker: assignedBroker ? toBroker(assignedBroker) : null,
    stage: row.stage,
    intent: row.intent,
    propertyType: row.propertyType,
    neighborhood: row.neighborhood,
    city: row.city,
    state: row.state,
    areaSqm: Number(row.areaSqm),
    bedrooms: row.bedrooms,
    parkingSpaces: row.parkingSpaces,
    askingPrice: row.askingPrice === null ? null : Number(row.askingPrice),
    description: row.description,
    linkedPropertyId: row.linkedPropertyId,
    rejectionReason: row.rejectionReason,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toOwnerLeadActivity(row: OwnerLeadActivityRow): OwnerLeadActivity {
  return { id: row.id, type: row.type, description: row.description, createdAt: row.createdAt.toISOString() };
}
