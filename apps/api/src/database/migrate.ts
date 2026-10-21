import "dotenv/config";

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Na primeira inicialização de um volume vazio, o Postgres oficial reinicia
 * uma vez sozinho ao terminar o initdb — nessa janela breve (poucos
 * segundos) a conexão é recusada mesmo com o container já "healthy" segundo
 * o docker compose. Sem retry aqui, a API crasha e orquestradores como o
 * Coolify tratam isso como falha definitiva de deploy em vez de uma corrida
 * transitória. Tentamos por até ~30s antes de desistir de verdade.
 */
async function waitForDatabase(client: postgres.Sql, retries = 15, intervalMs = 2000): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await client`SELECT 1`;
      return;
    } catch (error) {
      if (attempt === retries) throw error;
      console.log(
        `Banco ainda não disponível (tentativa ${attempt}/${retries}), tentando novamente em ${intervalMs}ms...`,
      );
      await delay(intervalMs);
    }
  }
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL não definido");
  }

  const migrationClient = postgres(connectionString, { max: 1 });

  await waitForDatabase(migrationClient);

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
