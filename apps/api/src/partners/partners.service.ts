import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { CreatePartnerRequest, Partner, UpdatePartnerRequest } from "@spire/contracts";
import { and, desc, eq, gte, isNull, lte, or } from "drizzle-orm";

import type { Database } from "../database/client";
import { DATABASE } from "../database/database.module";
import { partners } from "../database/schema";

function toPartner(row: typeof partners.$inferSelect): Partner {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    ctaUrl: row.ctaUrl,
    ctaLabel: row.ctaLabel,
    termsUrl: row.termsUrl,
    validFrom: row.validFrom,
    validUntil: row.validUntil,
    active: row.active,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

@Injectable()
export class PartnersService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async list(): Promise<Partner[]> {
    const rows = await this.db.select().from(partners).orderBy(desc(partners.createdAt));
    return rows.map(toPartner);
  }

  /** Público — diretório do Club, só parceiros ativos e dentro da vigência. */
  async listActive(): Promise<Partner[]> {
    const today = new Date().toISOString().slice(0, 10);
    const rows = await this.db
      .select()
      .from(partners)
      .where(
        and(
          eq(partners.active, true),
          or(isNull(partners.validFrom), lte(partners.validFrom, today)),
          or(isNull(partners.validUntil), gte(partners.validUntil, today)),
        ),
      )
      .orderBy(desc(partners.createdAt));
    return rows.map(toPartner);
  }

  async create(request: CreatePartnerRequest): Promise<Partner> {
    const [row] = await this.db
      .insert(partners)
      .values({
        name: request.name,
        category: request.category,
        description: request.description,
        ctaUrl: request.ctaUrl ?? null,
        ctaLabel: request.ctaLabel ?? null,
        termsUrl: request.termsUrl ?? null,
        validFrom: request.validFrom ?? null,
        validUntil: request.validUntil ?? null,
        active: request.active,
      })
      .returning();
    if (!row) throw new Error("Falha ao criar parceiro");
    return toPartner(row);
  }

  async update(id: string, request: UpdatePartnerRequest): Promise<Partner> {
    const [existing] = await this.db.select().from(partners).where(eq(partners.id, id)).limit(1);
    if (!existing) throw new NotFoundException({ code: "PARTNER_NOT_FOUND", message: "Parceiro não encontrado" });

    const [row] = await this.db
      .update(partners)
      .set({
        ...(request.name !== undefined ? { name: request.name } : {}),
        ...(request.category !== undefined ? { category: request.category } : {}),
        ...(request.description !== undefined ? { description: request.description } : {}),
        ...(request.ctaUrl !== undefined ? { ctaUrl: request.ctaUrl } : {}),
        ...(request.ctaLabel !== undefined ? { ctaLabel: request.ctaLabel } : {}),
        ...(request.termsUrl !== undefined ? { termsUrl: request.termsUrl } : {}),
        ...(request.validFrom !== undefined ? { validFrom: request.validFrom } : {}),
        ...(request.validUntil !== undefined ? { validUntil: request.validUntil } : {}),
        ...(request.active !== undefined ? { active: request.active } : {}),
        updatedAt: new Date(),
      })
      .where(eq(partners.id, id))
      .returning();
    return toPartner(row!);
  }

  async delete(id: string): Promise<void> {
    const [existing] = await this.db.select().from(partners).where(eq(partners.id, id)).limit(1);
    if (!existing) throw new NotFoundException({ code: "PARTNER_NOT_FOUND", message: "Parceiro não encontrado" });
    await this.db.delete(partners).where(eq(partners.id, id));
  }
}
