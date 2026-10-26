import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { Broker } from "@spire/contracts";
import { eq } from "drizzle-orm";

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
}
