import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { Broker, CreateBrokerRequest, UpdateBrokerRequest } from "@spire/contracts";
import { and, eq, ne } from "drizzle-orm";

import type { Database } from "../database/client";
import { DATABASE } from "../database/database.module";
import { brokers, properties } from "../database/schema";

import { toBroker } from "./broker-mapper";

@Injectable()
export class BrokersService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async list(): Promise<Broker[]> {
    const rows = await this.db.select().from(brokers);
    return rows.map(toBroker);
  }

  async getById(id: string): Promise<Broker> {
    const [row] = await this.db.select().from(brokers).where(eq(brokers.id, id)).limit(1);
    if (!row) throw new NotFoundException({ code: "BROKER_NOT_FOUND", message: "Corretor não encontrado" });
    return toBroker(row);
  }

  /**
   * Retorna o corretor autorizado do imóvel, ou `null` quando nenhum está
   * atribuído — nunca inventa um corretor aleatório para preencher a tela
   * ("autorizado" é uma afirmação real, não um placeholder de UI).
   */
  async getForProperty(propertyId: string): Promise<Broker | null> {
    const [property] = await this.db
      .select({ brokerId: properties.brokerId })
      .from(properties)
      .where(eq(properties.id, propertyId))
      .limit(1);
    if (!property) {
      throw new NotFoundException({ code: "PROPERTY_NOT_FOUND", message: "Imóvel não encontrado" });
    }
    if (!property.brokerId) return null;
    return this.getById(property.brokerId);
  }

  async create(request: CreateBrokerRequest): Promise<Broker> {
    const [existing] = await this.db.select({ id: brokers.id }).from(brokers).where(eq(brokers.email, request.email)).limit(1);
    if (existing) throw new ConflictException({ code: "BROKER_EMAIL_TAKEN", message: "Já existe um corretor com este e-mail" });

    const [row] = await this.db
      .insert(brokers)
      .values({
        name: request.name,
        email: request.email,
        phone: request.phone ?? null,
        avatarUrl: request.avatarUrl ?? null,
        bio: request.bio,
        creci: request.creci ?? null,
      })
      .returning();
    if (!row) throw new Error("Falha ao criar corretor");
    return toBroker(row);
  }

  async update(id: string, request: UpdateBrokerRequest): Promise<Broker> {
    const [current] = await this.db.select().from(brokers).where(eq(brokers.id, id)).limit(1);
    if (!current) throw new NotFoundException({ code: "BROKER_NOT_FOUND", message: "Corretor não encontrado" });

    if (request.email && request.email !== current.email) {
      const [existing] = await this.db
        .select({ id: brokers.id })
        .from(brokers)
        .where(and(eq(brokers.email, request.email), ne(brokers.id, id)))
        .limit(1);
      if (existing) throw new ConflictException({ code: "BROKER_EMAIL_TAKEN", message: "Já existe um corretor com este e-mail" });
    }

    const [row] = await this.db
      .update(brokers)
      .set({
        ...(request.name !== undefined && { name: request.name }),
        ...(request.email !== undefined && { email: request.email }),
        ...(request.phone !== undefined && { phone: request.phone }),
        ...(request.avatarUrl !== undefined && { avatarUrl: request.avatarUrl }),
        ...(request.bio !== undefined && { bio: request.bio }),
        ...(request.creci !== undefined && { creci: request.creci }),
      })
      .where(eq(brokers.id, id))
      .returning();
    if (!row) throw new Error("Falha ao atualizar corretor");
    return toBroker(row);
  }
}
