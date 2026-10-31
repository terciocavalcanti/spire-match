import { defineConfig } from "@playwright/test";

/**
 * Suíte e2e persistida (Marco F4) — substitui os scripts Playwright
 * descartáveis usados em todo verificação de UI até aqui (Marcos B-E).
 * Precisa da stack local rodando de verdade (`pnpm dev` na raiz, com
 * Postgres/Redis e dados demo semeados) — ver docs/qa/TEST_PLAN.md.
 * Usa só as contas demo já seedadas (nunca registra conta nova), para
 * poder rodar repetidamente sem acumular dado de teste nem depender de
 * limpeza manual depois.
 */
export default defineConfig({
  testDir: "./specs",
  globalSetup: "./support/global-setup.ts",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
});
