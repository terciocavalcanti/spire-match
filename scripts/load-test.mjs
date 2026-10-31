#!/usr/bin/env node
/**
 * Teste de carga honesto (Marco F5) — Node puro, sem dependência nova.
 *
 * Dispara concorrência real contra endpoints de leitura da API rodando
 * localmente e mede p50/p95/p99/erro de verdade. NÃO extrapola capacidade de
 * produção — os números aqui são de ambiente de desenvolvimento local
 * (máquina do desenvolvedor, um único processo Nest, Postgres/Redis em
 * containers locais), nunca uma estimativa de quanto a API suportaria em
 * produção. Ver docs/qa/GAPS_REPORT.md.
 *
 * Uso:
 *   node scripts/load-test.mjs [--concurrency=20] [--requests=100]
 *
 * Requer a stack local rodando (`pnpm dev` + Postgres/Redis) e os usuários
 * demo já seedados (apps/api/src/database/seed.ts).
 *
 * O padrão de 100 requisições por endpoint fica abaixo do ThrottlerGuard
 * global da API (120 req/60s por IP+rota, ver apps/api/src/app.module.ts) de
 * propósito — passar disso mede o guard de abuso, não a latência real do
 * endpoint. Os 429 do guard já foram confirmados manualmente como esperados.
 */

const API_URL = process.env.LOAD_TEST_API_URL ?? "http://localhost:4000/api/v1";
const DEMO_BUYER = { email: "demo.comprador@spirematch.com.br", password: "SpireDemo#2026" };
const DEMO_ADMIN = { email: "demo.admin@spirematch.com.br", password: "SpireDemo#2026" };

function parseArgs() {
  const args = Object.fromEntries(
    process.argv.slice(2).map((arg) => {
      const [key, value] = arg.replace(/^--/, "").split("=");
      return [key, value];
    }),
  );
  return {
    concurrency: Number(args.concurrency ?? 20),
    requests: Number(args.requests ?? 100),
  };
}

async function login(email, password) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error(`Login falhou para ${email} (status ${res.status}): ${await res.text()}`);
  }
  const setCookie = res.headers.get("set-cookie");
  if (!setCookie) throw new Error(`Login para ${email} não retornou cookie de sessão`);
  return setCookie.split(";")[0];
}

function percentile(sortedLatencies, p) {
  if (sortedLatencies.length === 0) return 0;
  const index = Math.min(sortedLatencies.length - 1, Math.ceil((p / 100) * sortedLatencies.length) - 1);
  return sortedLatencies[Math.max(0, index)];
}

async function runBatch({ name, url, cookie, concurrency, totalRequests }) {
  const latencies = [];
  let errors = 0;
  let completed = 0;

  async function worker() {
    while (completed < totalRequests) {
      completed += 1;
      const start = performance.now();
      try {
        const res = await fetch(url, { headers: cookie ? { Cookie: cookie } : {} });
        await res.text();
        if (!res.ok) errors += 1;
      } catch {
        errors += 1;
      }
      latencies.push(performance.now() - start);
    }
  }

  const wallStart = performance.now();
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  const wallMs = performance.now() - wallStart;

  const sorted = [...latencies].sort((a, b) => a - b);
  const avg = latencies.reduce((sum, v) => sum + v, 0) / latencies.length;

  return {
    name,
    totalRequests,
    concurrency,
    errors,
    errorRatePct: (errors / totalRequests) * 100,
    avgMs: avg,
    p50Ms: percentile(sorted, 50),
    p95Ms: percentile(sorted, 95),
    p99Ms: percentile(sorted, 99),
    minMs: sorted[0] ?? 0,
    maxMs: sorted[sorted.length - 1] ?? 0,
    reqPerSec: (totalRequests / wallMs) * 1000,
  };
}

function fmt(n) {
  return n.toFixed(1);
}

function printResult(r) {
  console.log(`\n${r.name}`);
  console.log(
    `  requisições=${r.totalRequests} concorrência=${r.concurrency} erros=${r.errors} (${fmt(r.errorRatePct)}%)`,
  );
  console.log(
    `  latência (ms) média=${fmt(r.avgMs)} p50=${fmt(r.p50Ms)} p95=${fmt(r.p95Ms)} p99=${fmt(r.p99Ms)} min=${fmt(r.minMs)} max=${fmt(r.maxMs)}`,
  );
  console.log(`  vazão=${fmt(r.reqPerSec)} req/s`);
}

async function main() {
  const { concurrency, requests } = parseArgs();

  console.log("=== Teste de carga — VALORI MATCH (Marco F5) ===");
  console.log(`API: ${API_URL}`);
  console.log(`Concorrência: ${concurrency} | Requisições por endpoint: ${requests}`);
  console.log(
    "AVISO: números de ambiente de desenvolvimento local (1 processo Nest, Postgres/Redis em containers locais).",
  );
  console.log("       NÃO representam capacidade de produção.\n");

  console.log("Autenticando usuários demo...");
  const buyerCookie = await login(DEMO_BUYER.email, DEMO_BUYER.password);
  const adminCookie = await login(DEMO_ADMIN.email, DEMO_ADMIN.password);
  console.log("OK.");

  const endpoints = [
    { name: "GET /properties (busca de imóveis, pública)", url: `${API_URL}/properties?limit=20`, cookie: null },
    { name: "GET /matches (Match Engine, comprador autenticado)", url: `${API_URL}/matches?limit=20`, cookie: buyerCookie },
    { name: "GET /leads (listagem CRM, admin autenticado)", url: `${API_URL}/leads?limit=30`, cookie: adminCookie },
  ];

  const results = [];
  for (const endpoint of endpoints) {
    const result = await runBatch({ ...endpoint, concurrency, totalRequests: requests });
    printResult(result);
    results.push(result);
  }

  console.log("\n=== Resumo (copiar para docs/qa/TEST_RESULTS.md — números reais, não extrapolar) ===");
  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error("Falha no teste de carga:", error);
  process.exitCode = 1;
});
