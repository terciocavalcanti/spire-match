import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type {
  AdminDevelopmentListQuery,
  CreateDevelopmentBlockRequest,
  CreateDevelopmentRequest,
  DevelopmentBlock,
  DevelopmentDetail,
  DevelopmentSummary,
  UpdateDevelopmentRequest,
} from "@spire/contracts";
import { and, eq, ilike, inArray, or, sql } from "drizzle-orm";

import type { Database } from "../database/client";
import { DATABASE } from "../database/database.module";
import { developmentBlocks, developments, units } from "../database/schema";

import { toDevelopmentDetail, toDevelopmentSummary } from "./development-mapper";

function slugify(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function decodeCursor(cursor: string | undefined): number {
  if (!cursor) return 0;
  const decoded = Number(Buffer.from(cursor, "base64url").toString("utf8"));
  return Number.isFinite(decoded) && decoded >= 0 ? decoded : 0;
}

function encodeCursor(offset: number): string {
  return Buffer.from(String(offset), "utf8").toString("base64url");
}

@Injectable()
export class DevelopmentsService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  private async unitsCountByDevelopment(developmentIds: string[]): Promise<Map<string, number>> {
    if (developmentIds.length === 0) return new Map();
    const rows = await this.db
      .select({ developmentId: units.developmentId, count: sql<number>`count(*)::int` })
      .from(units)
      .where(inArray(units.developmentId, developmentIds))
      .groupBy(units.developmentId);
    return new Map(rows.map((r) => [r.developmentId, r.count]));
  }

  private async uniqueSlug(name: string, excludeId?: string): Promise<string> {
    const base = slugify(name) || "empreendimento";
    let candidate = base;
    let suffix = 1;
    for (;;) {
      const [existing] = await this.db.select({ id: developments.id }).from(developments).where(eq(developments.slug, candidate)).limit(1);
      if (!existing || existing.id === excludeId) return candidate;
      suffix += 1;
      candidate = `${base}-${suffix}`;
    }
  }

  async list(query: AdminDevelopmentListQuery): Promise<{ items: DevelopmentSummary[]; nextCursor: string | null }> {
    const offset = decodeCursor(query.cursor);
    const conditions = [];
    if (query.status) conditions.push(eq(developments.status, query.status));
    if (query.q) conditions.push(or(ilike(developments.name, `%${query.q}%`), ilike(developments.neighborhood, `%${query.q}%`))!);

    const rows = await this.db
      .select()
      .from(developments)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(developments.createdAt)
      .limit(query.limit + 1)
      .offset(offset);

    const hasMore = rows.length > query.limit;
    const pageRows = hasMore ? rows.slice(0, query.limit) : rows;
    const counts = await this.unitsCountByDevelopment(pageRows.map((r) => r.id));

    return {
      items: pageRows.map((row) => toDevelopmentSummary(row, counts.get(row.id) ?? 0)),
      nextCursor: hasMore ? encodeCursor(offset + query.limit) : null,
    };
  }

  async getDetail(id: string): Promise<DevelopmentDetail> {
    const [row] = await this.db.select().from(developments).where(eq(developments.id, id)).limit(1);
    if (!row) throw new NotFoundException({ code: "DEVELOPMENT_NOT_FOUND", message: "Empreendimento não encontrado" });

    const blocks = await this.db.select().from(developmentBlocks).where(eq(developmentBlocks.developmentId, id));
    const counts = await this.unitsCountByDevelopment([id]);
    return toDevelopmentDetail(row, counts.get(id) ?? 0, blocks);
  }

  async create(request: CreateDevelopmentRequest): Promise<DevelopmentDetail> {
    const slug = await this.uniqueSlug(request.name);
    const [row] = await this.db
      .insert(developments)
      .values({
        slug,
        name: request.name,
        description: request.description,
        status: request.status,
        incorporatorName: request.incorporatorName ?? null,
        neighborhood: request.neighborhood,
        city: request.city,
        state: request.state.toUpperCase(),
        coverImageUrl: request.coverImageUrl ?? null,
        priceFrom: request.priceFrom != null ? request.priceFrom.toFixed(2) : null,
        deliveryDate: request.deliveryDate ?? null,
      })
      .returning();
    if (!row) throw new Error("Falha ao criar empreendimento");
    return toDevelopmentDetail(row, 0, []);
  }

  async update(id: string, request: UpdateDevelopmentRequest): Promise<DevelopmentDetail> {
    const [current] = await this.db.select().from(developments).where(eq(developments.id, id)).limit(1);
    if (!current) throw new NotFoundException({ code: "DEVELOPMENT_NOT_FOUND", message: "Empreendimento não encontrado" });

    const slug = request.name && request.name !== current.name ? await this.uniqueSlug(request.name, id) : current.slug;

    const [row] = await this.db
      .update(developments)
      .set({
        slug,
        ...(request.name !== undefined && { name: request.name }),
        ...(request.description !== undefined && { description: request.description }),
        ...(request.status !== undefined && { status: request.status }),
        ...(request.incorporatorName !== undefined && { incorporatorName: request.incorporatorName }),
        ...(request.neighborhood !== undefined && { neighborhood: request.neighborhood }),
        ...(request.city !== undefined && { city: request.city }),
        ...(request.state !== undefined && { state: request.state.toUpperCase() }),
        ...(request.coverImageUrl !== undefined && { coverImageUrl: request.coverImageUrl }),
        ...(request.priceFrom !== undefined && { priceFrom: request.priceFrom != null ? request.priceFrom.toFixed(2) : null }),
        ...(request.deliveryDate !== undefined && { deliveryDate: request.deliveryDate }),
        updatedAt: new Date(),
      })
      .where(eq(developments.id, id))
      .returning();
    if (!row) throw new Error("Falha ao atualizar empreendimento");
    return this.getDetail(row.id);
  }

  async addBlock(developmentId: string, request: CreateDevelopmentBlockRequest): Promise<DevelopmentBlock> {
    const [development] = await this.db.select({ id: developments.id }).from(developments).where(eq(developments.id, developmentId)).limit(1);
    if (!development) throw new NotFoundException({ code: "DEVELOPMENT_NOT_FOUND", message: "Empreendimento não encontrado" });

    const [row] = await this.db.insert(developmentBlocks).values({ developmentId, name: request.name }).returning();
    if (!row) throw new Error("Falha ao criar torre/bloco");
    return { id: row.id, name: row.name };
  }

  async removeBlock(developmentId: string, blockId: string): Promise<void> {
    const [row] = await this.db
      .delete(developmentBlocks)
      .where(and(eq(developmentBlocks.id, blockId), eq(developmentBlocks.developmentId, developmentId)))
      .returning({ id: developmentBlocks.id });
    if (!row) throw new NotFoundException({ code: "BLOCK_NOT_FOUND", message: "Torre/bloco não encontrado" });
  }
}
