import { Inject, Injectable } from "@nestjs/common";
import type { AttributionReport, VgvBreakdownEntry, VgvGroupBy, VgvReport } from "@spire/contracts";
import { and, eq, gte, inArray } from "drizzle-orm";

import type { Database } from "../database/client";
import { DATABASE } from "../database/database.module";
import { brokers, leadTouchpoints, leads, properties, users } from "../database/schema";

@Injectable()
export class ReportsService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  /** VGV reconhecido no período: leads que viraram GANHO (updatedAt) na janela — mesmo critério de AdminOverview. */
  async vgvReport(days: number, groupBy: VgvGroupBy): Promise<VgvReport> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const rows = await this.db
      .select({ lead: leads, broker: brokers, property: properties })
      .from(leads)
      .leftJoin(brokers, eq(brokers.id, leads.assignedBrokerId))
      .leftJoin(properties, eq(properties.id, leads.sourcePropertyId))
      .where(and(eq(leads.stage, "GANHO"), gte(leads.updatedAt, since)));

    const groups = new Map<string, VgvBreakdownEntry>();
    let vgv = 0;
    for (const row of rows) {
      const amount = row.lead.wonAmount ? Number(row.lead.wonAmount) : 0;
      vgv += amount;

      const key = groupBy === "broker" ? (row.broker?.id ?? "sem-corretor") : (row.property?.neighborhood ?? "sem-bairro");
      const label = groupBy === "broker" ? (row.broker?.name ?? "Sem corretor") : (row.property?.neighborhood ?? "Sem imóvel de origem");

      const entry = groups.get(key) ?? { key, label, vgv: 0, wonCount: 0 };
      entry.vgv += amount;
      entry.wonCount += 1;
      groups.set(key, entry);
    }

    return {
      vgv,
      wonCount: rows.length,
      breakdown: [...groups.values()].sort((a, b) => b.vgv - a.vgv),
    };
  }

  async attributionReport(days: number): Promise<AttributionReport> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const wonLeads = await this.db
      .select({ lead: leads, buyer: users })
      .from(leads)
      .innerJoin(users, eq(users.id, leads.userId))
      .where(and(eq(leads.stage, "GANHO"), gte(leads.updatedAt, since)));

    if (wonLeads.length === 0) return { rows: [], byFirstTouch: [], byLastTouch: [] };

    const leadIds = wonLeads.map((w) => w.lead.id);
    const touchpoints = await this.db
      .select()
      .from(leadTouchpoints)
      .where(inArray(leadTouchpoints.leadId, leadIds))
      .orderBy(leadTouchpoints.leadId, leadTouchpoints.occurredAt);

    const touchesByLead = new Map<string, typeof touchpoints>();
    for (const tp of touchpoints) {
      const list = touchesByLead.get(tp.leadId) ?? [];
      list.push(tp);
      touchesByLead.set(tp.leadId, list);
    }

    const byFirstTouch = new Map<string, VgvBreakdownEntry>();
    const byLastTouch = new Map<string, VgvBreakdownEntry>();
    const rows: AttributionReport["rows"] = [];

    for (const { lead, buyer } of wonLeads) {
      const touches = touchesByLead.get(lead.id) ?? [];
      if (touches.length === 0) continue; // sem sinal registrado — nada a atribuir (não deveria ocorrer para um lead GANHO)

      const first = touches[0]!;
      const last = touches[touches.length - 1]!;
      const amount = lead.wonAmount ? Number(lead.wonAmount) : 0;
      const influencedChannels = [...new Set(touches.slice(1, -1).map((t) => t.channel))].filter(
        (c) => c !== first.channel && c !== last.channel,
      );

      rows.push({
        leadId: lead.id,
        buyerName: buyer.name,
        wonAmount: amount,
        firstTouchChannel: first.channel,
        firstTouchAt: first.occurredAt.toISOString(),
        lastTouchChannel: last.channel,
        lastTouchAt: last.occurredAt.toISOString(),
        influencedChannels,
      });

      const firstEntry = byFirstTouch.get(first.channel) ?? { key: first.channel, label: first.channel, vgv: 0, wonCount: 0 };
      firstEntry.vgv += amount;
      firstEntry.wonCount += 1;
      byFirstTouch.set(first.channel, firstEntry);

      const lastEntry = byLastTouch.get(last.channel) ?? { key: last.channel, label: last.channel, vgv: 0, wonCount: 0 };
      lastEntry.vgv += amount;
      lastEntry.wonCount += 1;
      byLastTouch.set(last.channel, lastEntry);
    }

    return {
      rows,
      byFirstTouch: [...byFirstTouch.values()].map((e) => ({ channel: e.key as AttributionReport["byFirstTouch"][number]["channel"], wonCount: e.wonCount, vgv: e.vgv })),
      byLastTouch: [...byLastTouch.values()].map((e) => ({ channel: e.key as AttributionReport["byLastTouch"][number]["channel"], wonCount: e.wonCount, vgv: e.vgv })),
    };
  }
}
