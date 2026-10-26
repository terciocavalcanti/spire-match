import { Inject, Injectable, NotFoundException, UnprocessableEntityException } from "@nestjs/common";
import type { Contact, CreateContactRequest } from "@spire/contracts";
import { desc, eq } from "drizzle-orm";

import type { Database } from "../database/client";
import { DATABASE } from "../database/database.module";
import { brokers, contacts, properties } from "../database/schema";
import { LeadsService } from "../leads/leads.service";

import { toContact } from "./contact-mapper";

@Injectable()
export class ContactsService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly leads: LeadsService,
  ) {}

  async create(userId: string, request: CreateContactRequest): Promise<Contact> {
    const [property] = await this.db.select().from(properties).where(eq(properties.id, request.propertyId)).limit(1);
    if (!property) throw new NotFoundException({ code: "PROPERTY_NOT_FOUND", message: "Imóvel não encontrado" });
    if (!property.brokerId) {
      throw new UnprocessableEntityException({
        code: "NO_BROKER_ASSIGNED",
        message: "Este imóvel ainda não tem um corretor autorizado atribuído",
      });
    }

    const [broker] = await this.db.select().from(brokers).where(eq(brokers.id, property.brokerId)).limit(1);
    if (!broker) throw new NotFoundException({ code: "BROKER_NOT_FOUND", message: "Corretor não encontrado" });

    const [row] = await this.db
      .insert(contacts)
      .values({ userId, propertyId: request.propertyId, brokerId: broker.id, channel: request.channel, message: request.message })
      .returning();
    if (!row) throw new Error("Falha ao registrar contato");

    await this.leads.recordSignal(
      userId,
      "CONTACT",
      `Contato com ${broker.name} sobre ${property.title}: "${request.message}"`,
      property.id,
    );

    return toContact(row, property, broker);
  }

  async listMine(userId: string): Promise<Contact[]> {
    const rows = await this.db
      .select({ contact: contacts, property: properties, broker: brokers })
      .from(contacts)
      .innerJoin(properties, eq(properties.id, contacts.propertyId))
      .innerJoin(brokers, eq(brokers.id, contacts.brokerId))
      .where(eq(contacts.userId, userId))
      .orderBy(desc(contacts.createdAt));

    return rows.map(({ contact, property, broker }) => toContact(contact, property, broker));
  }
}
