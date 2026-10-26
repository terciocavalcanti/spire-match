import type { Contact } from "@spire/contracts";

import { toBroker } from "../brokers/broker-mapper";
import type { brokers, contacts, properties } from "../database/schema";
import { toPropertySummary } from "../properties/property-mapper";

type ContactRow = typeof contacts.$inferSelect;
type PropertyRow = typeof properties.$inferSelect;
type BrokerRow = typeof brokers.$inferSelect;

export function toContact(row: ContactRow, property: PropertyRow, broker: BrokerRow): Contact {
  return {
    id: row.id,
    propertyId: row.propertyId,
    property: toPropertySummary(property),
    brokerId: row.brokerId,
    broker: toBroker(broker),
    channel: row.channel,
    message: row.message,
    createdAt: row.createdAt.toISOString(),
  };
}
