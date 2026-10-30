import type { DevelopmentDetail, DevelopmentSummary } from "@spire/contracts";

import type { developmentBlocks, developments } from "../database/schema";

type DevelopmentRow = typeof developments.$inferSelect;
type BlockRow = typeof developmentBlocks.$inferSelect;

export function toDevelopmentSummary(row: DevelopmentRow, unitsCount: number): DevelopmentSummary {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    status: row.status,
    neighborhood: row.neighborhood,
    city: row.city,
    state: row.state,
    coverImageUrl: row.coverImageUrl,
    priceFrom: row.priceFrom ? Number(row.priceFrom) : null,
    deliveryDate: row.deliveryDate,
    unitsCount,
    createdAt: row.createdAt.toISOString(),
  };
}

export function toDevelopmentDetail(row: DevelopmentRow, unitsCount: number, blocks: BlockRow[]): DevelopmentDetail {
  return {
    ...toDevelopmentSummary(row, unitsCount),
    description: row.description,
    incorporatorName: row.incorporatorName,
    blocks: blocks.map((b) => ({ id: b.id, name: b.name })),
  };
}
