import type { Proposal } from "@spire/contracts";

import type { properties, proposals } from "../database/schema";
import { toPropertySummary } from "../properties/property-mapper";

type ProposalRow = typeof proposals.$inferSelect;
type PropertyRow = typeof properties.$inferSelect;

export function toProposal(row: ProposalRow, property: PropertyRow): Proposal {
  return {
    id: row.id,
    propertyId: row.propertyId,
    property: toPropertySummary(property),
    amount: Number(row.amount),
    paymentMethod: row.paymentMethod,
    message: row.message,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}
