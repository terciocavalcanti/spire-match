import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { Campaign, CampaignListQuery, CampaignStats, CreateCampaignRequest, UpdateCampaignRequest } from "@spire/contracts";
import { and, desc, eq } from "drizzle-orm";

import type { Database } from "../database/client";
import { DATABASE } from "../database/database.module";
import { campaigns, developments } from "../database/schema";

import { toCampaign } from "./campaign-mapper";
import { computeDevelopmentStats } from "./development-stats";

function decodeCursor(cursor: string | undefined): number {
  if (!cursor) return 0;
  const decoded = Number(Buffer.from(cursor, "base64url").toString("utf8"));
  return Number.isFinite(decoded) && decoded >= 0 ? decoded : 0;
}
function encodeCursor(offset: number): string {
  return Buffer.from(String(offset), "utf8").toString("base64url");
}

@Injectable()
export class CampaignsService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async list(query: CampaignListQuery): Promise<{ items: Campaign[]; nextCursor: string | null }> {
    const offset = decodeCursor(query.cursor);
    const conditions = [];
    if (query.status) conditions.push(eq(campaigns.status, query.status));

    const rows = await this.db
      .select({ campaign: campaigns, development: developments })
      .from(campaigns)
      .leftJoin(developments, eq(developments.id, campaigns.developmentId))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(campaigns.createdAt))
      .limit(query.limit + 1)
      .offset(offset);

    const hasMore = rows.length > query.limit;
    const pageRows = hasMore ? rows.slice(0, query.limit) : rows;

    return {
      items: pageRows.map((r) => toCampaign(r.campaign, r.development)),
      nextCursor: hasMore ? encodeCursor(offset + query.limit) : null,
    };
  }

  private async findOrThrow(id: string) {
    const [row] = await this.db
      .select({ campaign: campaigns, development: developments })
      .from(campaigns)
      .leftJoin(developments, eq(developments.id, campaigns.developmentId))
      .where(eq(campaigns.id, id))
      .limit(1);
    if (!row) throw new NotFoundException({ code: "CAMPAIGN_NOT_FOUND", message: "Campanha não encontrada" });
    return row;
  }

  async detail(id: string): Promise<Campaign> {
    const row = await this.findOrThrow(id);
    return toCampaign(row.campaign, row.development);
  }

  async create(request: CreateCampaignRequest): Promise<Campaign> {
    const [row] = await this.db
      .insert(campaigns)
      .values({
        developmentId: request.developmentId ?? null,
        name: request.name,
        type: request.type,
        channel: request.channel,
        sponsorName: request.sponsorName ?? null,
        startDate: request.startDate,
        endDate: request.endDate ?? null,
        budget: request.budget != null ? request.budget.toFixed(2) : null,
        goalDescription: request.goalDescription ?? null,
      })
      .returning();
    if (!row) throw new Error("Falha ao criar campanha");
    return this.detail(row.id);
  }

  async update(id: string, request: UpdateCampaignRequest): Promise<Campaign> {
    await this.findOrThrow(id);

    await this.db
      .update(campaigns)
      .set({
        ...(request.developmentId !== undefined ? { developmentId: request.developmentId } : {}),
        ...(request.name !== undefined ? { name: request.name } : {}),
        ...(request.type !== undefined ? { type: request.type } : {}),
        ...(request.channel !== undefined ? { channel: request.channel } : {}),
        ...(request.sponsorName !== undefined ? { sponsorName: request.sponsorName } : {}),
        ...(request.startDate !== undefined ? { startDate: request.startDate } : {}),
        ...(request.endDate !== undefined ? { endDate: request.endDate } : {}),
        ...(request.budget !== undefined ? { budget: request.budget != null ? request.budget.toFixed(2) : null } : {}),
        ...(request.goalDescription !== undefined ? { goalDescription: request.goalDescription } : {}),
        ...(request.status !== undefined ? { status: request.status } : {}),
        updatedAt: new Date(),
      })
      .where(eq(campaigns.id, id));

    return this.detail(id);
  }

  async delete(id: string): Promise<void> {
    await this.findOrThrow(id);
    await this.db.delete(campaigns).where(eq(campaigns.id, id));
  }

  async stats(id: string): Promise<CampaignStats> {
    const row = await this.findOrThrow(id);
    if (!row.campaign.developmentId) {
      return { leadsCount: 0, wonCount: 0, vgv: 0, linkedPropertiesCount: 0 };
    }
    return computeDevelopmentStats(this.db, row.campaign.developmentId);
  }
}
