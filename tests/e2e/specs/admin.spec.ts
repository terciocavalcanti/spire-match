import { expect, test } from "@playwright/test";

import { trackConsoleErrors } from "../support/auth";
import { ADMIN_URL } from "../support/urls";

test.describe("Admin (painel comercial)", () => {
  test.use({ storageState: "support/.auth/admin.json" });

  test("visão geral mostra o painel do time comercial", async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await page.goto(`${ADMIN_URL}/admin`, { waitUntil: "networkidle" });

    await expect(page.locator("h1")).toContainText(/Bom dia|Boa tarde|Boa noite/);
    expect(errors).toEqual([]);
  });

  const SIMPLE_PAGES: Array<{ path: string; heading: string }> = [
    { path: "/admin/leads", heading: "Leads / Oportunidades" },
    { path: "/admin/proprietarios", heading: "Proprietários" },
    { path: "/admin/captacoes", heading: "Captações" },
    { path: "/admin/campanhas", heading: "Campanhas" },
    { path: "/admin/parceiros", heading: "Parceiros" },
    { path: "/admin/conteudo", heading: "Conteúdo" },
    { path: "/admin/auditoria", heading: "Auditoria" },
    { path: "/admin/privacidade", heading: "Privacidade" },
    { path: "/admin/configuracoes", heading: "Configurações" },
  ];

  for (const { path, heading } of SIMPLE_PAGES) {
    test(`${path} renderiza sem erro de console`, async ({ page }) => {
      const errors = trackConsoleErrors(page);
      await page.goto(`${ADMIN_URL}${path}`, { waitUntil: "networkidle" });

      await expect(page.getByRole("heading", { name: heading, level: 1 })).toBeVisible();
      expect(errors).toEqual([]);
    });
  }

  test("captações mostra o kanban com todos os estágios do pipeline", async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await page.goto(`${ADMIN_URL}/admin/captacoes`, { waitUntil: "networkidle" });

    for (const stage of ["Novo", "Triagem", "Aprovado", "Rejeitado"]) {
      await expect(page.getByText(stage, { exact: true }).first()).toBeVisible();
    }
    expect(errors).toEqual([]);
  });
});
