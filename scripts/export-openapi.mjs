#!/usr/bin/env node
/**
 * Exporta o documento OpenAPI (Swagger) real, já montado em
 * apps/api/src/main.ts via SwaggerModule, para apps/api/openapi.json.
 *
 * Não escreve o documento à mão — busca o JSON que a própria API expõe em
 * runtime (SwaggerModule.setup gera "<path>-json" automaticamente), então o
 * arquivo exportado nunca diverge das rotas/DTOs reais.
 *
 * Requer a API rodando localmente (`pnpm dev` ou `pnpm --filter @spire/api dev`).
 *
 * Uso: node scripts/export-openapi.mjs
 */
import { writeFile } from "node:fs/promises";

const API_URL = process.env.LOAD_TEST_API_URL ?? "http://localhost:4000";
const OUTPUT_PATH = new URL("../apps/api/openapi.json", import.meta.url);

async function main() {
  const res = await fetch(`${API_URL}/api/docs-json`);
  if (!res.ok) {
    throw new Error(`Falha ao buscar o documento OpenAPI (status ${res.status}). A API está rodando em ${API_URL}?`);
  }
  const document = await res.json();
  await writeFile(OUTPUT_PATH, `${JSON.stringify(document, null, 2)}\n`, "utf8");
  console.log(`OpenAPI exportado para apps/api/openapi.json (${Object.keys(document.paths ?? {}).length} rotas).`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
