import type { Campaign } from "@spire/contracts";

import type { campaigns, developments } from "../database/schema";

type CampaignRow = typeof campaigns.$inferSelect;
type DevelopmentRow = typeof developments.$inferSelect;

export function toCampaign(row: CampaignRow, development: DevelopmentRow | null): Campaign {
  return {
    id: row.id,
    developmentId: row.developmentId,
    developmentName: development?.name ?? null,
    name: row.name,
    type: row.type,
    channel: row.channel,
    sponsorName: row.sponsorName,
    startDate: row.startDate,
    endDate: row.endDate,
    budget: row.budget ? Number(row.budget) : null,
    status: row.status,
    goalDescription: row.goalDescription,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
