import { eq } from "drizzle-orm";

import type { Database } from "./client";
import { brokers } from "./schema";

/**
 * Corretores de demonstração — sem telefone real cadastrado de propósito:
 * o CTA de WhatsApp em "Fale com um consultor" nunca deve enviar um número
 * fictício para o usuário (ver apps/web `AtendimentoPage`).
 */
const BROKER_SEEDS = [
  {
    email: "ana.broker@spirematch.com.br",
    name: "Ana Beatriz Souza",
    bio: "[DEMONSTRAÇÃO] Especialista em Boa Viagem e Pina, 8 anos de mercado imobiliário no Recife.",
    creci: "CRECI-PE 00000-DEMO",
  },
  {
    email: "carlos.broker@spirematch.com.br",
    name: "Carlos Eduardo Lima",
    bio: "[DEMONSTRAÇÃO] Foco em imóveis de alto padrão e lançamentos na Zona Sul do Recife.",
    creci: "CRECI-PE 00001-DEMO",
  },
] as const;

export async function seedBrokers(db: Database): Promise<string[]> {
  const ids: string[] = [];
  for (const seed of BROKER_SEEDS) {
    const [row] = await db
      .insert(brokers)
      .values({ name: seed.name, email: seed.email, bio: seed.bio, creci: seed.creci })
      .onConflictDoUpdate({ target: brokers.email, set: { name: seed.name, bio: seed.bio, creci: seed.creci } })
      .returning({ id: brokers.id });
    if (row) ids.push(row.id);
  }

  if (ids.length === 0) {
    const existing = await db.select({ id: brokers.id }).from(brokers).where(eq(brokers.email, BROKER_SEEDS[0].email));
    ids.push(...existing.map((e) => e.id));
  }


  console.log(`Corretores DEMONSTRAÇÃO garantidos: ${ids.length}`);
  return ids;
}
