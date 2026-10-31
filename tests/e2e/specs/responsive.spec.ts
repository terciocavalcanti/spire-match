import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

import { trackConsoleErrors } from "../support/auth";
import { ADMIN_URL, WEB_URL } from "../support/urls";

/**
 * Matriz de viewports (Marco F5) — a aproximação automatizável e honesta de
 * "PWA cross-device": garante que as telas principais não quebram layout em
 * mobile/tablet/desktop. Teste em hardware físico real continua uma lacuna
 * (ver docs/qa/GAPS_REPORT.md).
 */
const VIEWPORTS = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
];

async function expectNoHorizontalOverflow(page: Page) {
  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  expect(hasOverflow, "scrollWidth > clientWidth indica overflow horizontal").toBe(false);
}

for (const viewport of VIEWPORTS) {
  test.describe(`Responsivo — ${viewport.name} (${viewport.width}x${viewport.height}) — web`, () => {
    test.use({ storageState: "support/.auth/buyer.json", viewport: { width: viewport.width, height: viewport.height } });

    test("web /inicio não tem overflow horizontal", async ({ page }) => {
      const errors = trackConsoleErrors(page);
      await page.goto(`${WEB_URL}/inicio`, { waitUntil: "networkidle" });
      await expectNoHorizontalOverflow(page);
      expect(errors).toEqual([]);
    });
  });

  test.describe(`Responsivo — ${viewport.name} (${viewport.width}x${viewport.height}) — admin`, () => {
    test.use({ storageState: "support/.auth/admin.json", viewport: { width: viewport.width, height: viewport.height } });

    test("admin /admin/leads não tem overflow horizontal", async ({ page }) => {
      const errors = trackConsoleErrors(page);
      await page.goto(`${ADMIN_URL}/admin/leads`, { waitUntil: "networkidle" });
      await expectNoHorizontalOverflow(page);
      expect(errors).toEqual([]);
    });
  });
}
