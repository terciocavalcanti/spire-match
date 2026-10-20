import "dotenv/config";

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL não definido");
  }

  const migrationClient = postgres(connectionString, { max: 1 });

  // PostGIS é habilitado aqui (idempotente) para que colunas geográficas do
  // Marco B (properties, neighborhoods) possam ser adicionadas sem uma nova
  // migration dedicada só para a extensão.
  await migrationClient.unsafe("CREATE EXTENSION IF NOT EXISTS postgis");

  await migrate(drizzle(migrationClient), { migrationsFolder: "./src/database/migrations" });

  await migrationClient.end();
   
  console.log("Migrations aplicadas com sucesso.");
}

main().catch((error) => {
   
  console.error("Falha ao aplicar migrations:", error);
  process.exit(1);
});
