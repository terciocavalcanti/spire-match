import type { Visit } from "@spire/contracts";

import { toBroker } from "../brokers/broker-mapper";
import type { brokers, properties, visits } from "../database/schema";
import { toPropertySummary } from "../properties/property-mapper";

type VisitRow = typeof visits.$inferSelect;
type PropertyRow = typeof properties.$inferSelect;
type BrokerRow = typeof brokers.$inferSelect;

export function toVisit(row: VisitRow, property: PropertyRow, broker: BrokerRow): Visit {
  return {
    id: row.id,
    propertyId: row.propertyId,
    property: toPropertySummary(property),
    brokerId: row.brokerId,
    broker: toBroker(broker),
    scheduledAt: row.scheduledAt.toISOString(),
    status: row.status,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
  };
}
