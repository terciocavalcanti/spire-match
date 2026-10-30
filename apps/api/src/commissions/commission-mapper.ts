import type { Commission } from "@spire/contracts";

import type { brokers, commissions, properties, users } from "../database/schema";

type CommissionRow = typeof commissions.$inferSelect;
type UserRow = typeof users.$inferSelect;
type BrokerRow = typeof brokers.$inferSelect;
type PropertyRow = typeof properties.$inferSelect;

export function toCommission(
  row: CommissionRow,
  buyer: UserRow,
  broker: BrokerRow | null,
  property: PropertyRow | null,
): Commission {
  return {
    id: row.id,
    leadId: row.leadId,
    buyerName: buyer.name,
    brokerId: row.brokerId,
    brokerName: broker?.name ?? null,
    propertyId: row.propertyId,
    propertyTitle: property?.title ?? null,
    baseAmount: Number(row.baseAmount),
    rate: Number(row.rate),
    previstoAmount: Number(row.previstoAmount),
    recebidoAmount: row.recebidoAmount ? Number(row.recebidoAmount) : null,
    recebidoAt: row.recebidoAt?.toISOString() ?? null,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}
