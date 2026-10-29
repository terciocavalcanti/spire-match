import "dotenv/config";

import { ROLES } from "@spire/contracts";
import * as argon2 from "argon2";
import { eq } from "drizzle-orm";


import { createDatabase } from "./client";
import { buyerProfiles, roleAssignments, roles, users } from "./schema";
import { seedBrokers } from "./seed-brokers";
import { seedProperties } from "./seed-properties";

const DEMO_PASSWORD = "SpireDemo#2026";

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Seed de demonstração bloqueado em produção. Use apenas em ambiente local/homologação.",
    );
  }
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL não definido");

  const db = createDatabase(connectionString);

  for (const roleName of ROLES) {
    await db.insert(roles).values({ name: roleName }).onConflictDoNothing({ target: roles.name });
  }
   
  console.log(`Roles garantidas: ${ROLES.join(", ")}`);

  const passwordHash = await argon2.hash(DEMO_PASSWORD, { type: argon2.argon2id });

  const demoAccounts = [
    { name: "Tércio (Demo Comprador)", email: "demo.comprador@spirematch.com.br", role: "BUYER" as const },
    { name: "Admin VALORI (Demo)", email: "demo.admin@spirematch.com.br", role: "ADMIN" as const },
  ];

  for (const account of demoAccounts) {
    const [user] = await db
      .insert(users)
      .values({
        name: account.name,
        email: account.email,
        passwordHash,
        emailVerifiedAt: new Date(),
      })
      .onConflictDoUpdate({ target: users.email, set: { name: account.name } })
      .returning({ id: users.id });

    const [role] = await db.select().from(roles).where(eq(roles.name, account.role)).limit(1);
    if (user && role) {
      await db
        .insert(roleAssignments)
        .values({ userId: user.id, roleId: role.id })
        .onConflictDoNothing({ target: [roleAssignments.userId, roleAssignments.roleId] });
    }

    if (user && account.role === "BUYER") {
      await db
        .insert(buyerProfiles)
        .values({
          userId: user.id,
          budgetMin: "800000.00",
          budgetMax: "1300000.00",
          desiredNeighborhoods: ["Boa Viagem", "Pina", "Setúbal"],
          minAreaSqm: "80.00",
          minBedrooms: 3,
          minParkingSpaces: 2,
          purpose: "MORAR",
          paymentMethods: ["FINANCIAMENTO", "A_VISTA"],
          desiredFeatures: ["vista mar", "varanda gourmet"],
          onboardingCompletedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: buyerProfiles.userId,
          set: { updatedAt: new Date() },
        });
    }
  }

  const brokerIds = await seedBrokers(db);
  await seedProperties(db, brokerIds);


  console.log(
    `Contas DEMONSTRAÇÃO prontas (senha "${DEMO_PASSWORD}"):\n` +
      demoAccounts.map((a) => `  - ${a.email} (${a.role})`).join("\n") +
      "\nUso exclusivo de homologação — nunca ativar em produção.",
  );
  process.exit(0);
}

main().catch((error) => {
   
  console.error("Falha ao popular seed:", error);
  process.exit(1);
});
