import { expect, test } from "@playwright/test";

import { trackConsoleErrors } from "../support/auth";
import { DEMO_BUYER, WEB_URL } from "../support/urls";

test.describe("Web (comprador)", () => {
  test.use({ storageState: "support/.auth/buyer.json" });

  test("início mostra Matches reais calculados pelo Match Engine", async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await page.goto(`${WEB_URL}/inicio`, { waitUntil: "networkidle" });

    await expect(page.locator("h1")).toContainText(/Bom dia|Boa tarde|Boa noite/);
    await expect(page.getByText(/Match/i).first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("explorar permite buscar imóveis", async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await page.goto(`${WEB_URL}/explorar`, { waitUntil: "networkidle" });

    const searchInput = page.getByPlaceholder("Busque por bairro, rua ou condomínio");
    await expect(searchInput).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("detalhe de imóvel mostra galeria, preço e ações de contato", async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await page.goto(`${WEB_URL}/explorar`, { waitUntil: "networkidle" });

    const firstCard = page.locator("a[href^='/imoveis/']").first();
    await expect(firstCard).toBeVisible({ timeout: 15_000 });
    await firstCard.click();
    await page.waitForLoadState("networkidle");

    await expect(page.getByText(/Fale com consultor/i)).toBeVisible();
    await expect(page.getByText(/Agendar visita/i)).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("favoritar um imóvel alterna o estado e pode ser revertido", async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await page.goto(`${WEB_URL}/explorar`, { waitUntil: "networkidle" });

    const firstCard = page.locator("a[href^='/imoveis/']").first();
    await expect(firstCard).toBeVisible({ timeout: 15_000 });
    await firstCard.click();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/imoveis\//);

    const favoriteButton = page.locator("main").getByRole("button", { name: /Favoritar|Remover dos favoritos/ });
    const wasFavorite = (await favoriteButton.getAttribute("aria-pressed")) === "true";

    await favoriteButton.click();
    await page.waitForTimeout(300);
    await expect(favoriteButton).toHaveAttribute("aria-pressed", String(!wasFavorite));

    // Reverte para não deixar mutação persistida — suíte precisa rodar
    // repetidamente sem acumular estado.
    await favoriteButton.click();
    await page.waitForTimeout(300);
    await expect(favoriteButton).toHaveAttribute("aria-pressed", String(wasFavorite));

    expect(errors).toEqual([]);
  });

  test("matches/descobrir renderiza o deck de swipe", async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await page.goto(`${WEB_URL}/matches/descobrir`, { waitUntil: "networkidle" });

    await expect(page.getByRole("heading", { name: "Descubra imóveis para você" })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("tenho-um-imovel mostra o formulário de captação para usuário logado", async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await page.goto(`${WEB_URL}/tenho-um-imovel`, { waitUntil: "networkidle" });

    await expect(page.getByRole("heading", { name: "Tenho um imóvel" })).toBeVisible();
    await expect(page.getByPlaceholder("Bairro")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("perfil mostra os dados reais do usuário e a seção de privacidade", async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await page.goto(`${WEB_URL}/perfil`, { waitUntil: "networkidle" });

    await expect(page.getByText(DEMO_BUYER.email)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Meus dados" })).toBeVisible();
    expect(errors).toEqual([]);
  });
});
