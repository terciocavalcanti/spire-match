import type { Broker } from "@spire/contracts";

import type { brokers } from "../database/schema";

type BrokerRow = typeof brokers.$inferSelect;

export function toBroker(row: BrokerRow): Broker {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    avatarUrl: row.avatarUrl,
    bio: row.bio,
    creci: row.creci,
  };
}
