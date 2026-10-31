import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { ADMIN_URL, WEB_URL } from "../support/urls";

/**
 * Passada automatizada de acessibilidade (Marco F5) via axe-core — a
 * aproximação honesta e automatizável do item "acessibilidade" do prompt
 * mestre. Falha só em violações de impacto crítico/sério; violações
 * moderadas/leves são logadas, não travam a suíte (ver docs/qa/GAPS_REPORT.md
 * para o estado completo, incluindo o que ainda não foi varrido).
 */
function reportAndAssertNoSeriousViolations(label: string, violations: Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"]) {
  const serious = violations.filter((v) => v.impact === "critical" || v.impact === "serious");
  if (violations.length > 0) {
    console.log(`[a11y] ${label}: ${violations.length} violação(ões) encontradas (${serious.length} crítica/séria)`);
    for (const v of violations) {
      console.log(`  - [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} ocorrência(s))`);
    }
  }
  expect(serious, `${label} tem violação de acessibilidade crítica/séria`).toEqual([]);
}

test.describe("Acessibilidade (axe-core) — web", () => {
  test.use({ storageState: "support/.auth/buyer.json" });

  test("web: início", async ({ page }) => {
    await page.goto(`${WEB_URL}/inicio`, { waitUntil: "networkidle" });
    const results = await new AxeBuilder({ page }).analyze();
    reportAndAssertNoSeriousViolations("web /inicio", results.violations);
  });

  test("web: explorar", async ({ page }) => {
    await page.goto(`${WEB_URL}/explorar`, { waitUntil: "networkidle" });
    const results = await new AxeBuilder({ page }).analyze();
    reportAndAssertNoSeriousViolations("web /explorar", results.violations);
  });

  test("web: perfil", async ({ page }) => {
    await page.goto(`${WEB_URL}/perfil`, { waitUntil: "networkidle" });
    const results = await new AxeBuilder({ page }).analyze();
    reportAndAssertNoSeriousViolations("web /perfil", results.violations);
  });
});

test.describe("Acessibilidade (axe-core) — admin", () => {
  test.use({ storageState: "support/.auth/admin.json" });

  test("admin: visão geral", async ({ page }) => {
    await page.goto(`${ADMIN_URL}/admin`, { waitUntil: "networkidle" });
    const results = await new AxeBuilder({ page }).analyze();
    reportAndAssertNoSeriousViolations("admin /admin", results.violations);
  });

  test("admin: leads", async ({ page }) => {
    await page.goto(`${ADMIN_URL}/admin/leads`, { waitUntil: "networkidle" });
    const results = await new AxeBuilder({ page }).analyze();
    reportAndAssertNoSeriousViolations("admin /admin/leads", results.violations);
  });
});
