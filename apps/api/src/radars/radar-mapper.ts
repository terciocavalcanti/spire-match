import type { Radar } from "@spire/contracts";

import type { radars } from "../database/schema";

type RadarRow = typeof radars.$inferSelect;

export function toRadar(row: RadarRow, newMatchesCount: number): Radar {
  return {
    id: row.id,
    name: row.name,
    criteria: row.criteria,
    active: row.active,
    lastCheckedAt: row.lastCheckedAt ? row.lastCheckedAt.toISOString() : null,
    newMatchesCount,
    createdAt: row.createdAt.toISOString(),
  };
}
