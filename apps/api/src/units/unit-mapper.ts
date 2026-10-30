import type { Unit } from "@spire/contracts";

import type { units } from "../database/schema";

type UnitRow = typeof units.$inferSelect;

export function toUnit(row: UnitRow, developmentName: string, blockName: string | null): Unit {
  return {
    id: row.id,
    developmentId: row.developmentId,
    developmentName,
    blockId: row.blockId,
    blockName,
    identifier: row.identifier,
    floor: row.floor,
    areaSqm: Number(row.areaSqm),
    bedrooms: row.bedrooms,
    parkingSpaces: row.parkingSpaces,
    price: Number(row.price),
    status: row.status,
    propertyId: row.propertyId,
    createdAt: row.createdAt.toISOString(),
  };
}
