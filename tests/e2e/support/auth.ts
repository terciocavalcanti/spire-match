import type { Page } from "@playwright/test";

export async function login(page: Page, baseUrl: string, email: string, password: string): Promise<void> {
  await page.goto(`${baseUrl}/entrar`, { waitUntil: "networkidle" });
  await page.fill("#email", email);
  await page.fill("#password", password);

  const [response] = await Promise.all([page.waitForResponse((res) => res.url().includes("/auth/login")), page.click('button[type="submit"]')]);
  if (!response.ok()) {
    throw new Error(`Login falhou para ${email} (status ${response.status()}): ${await response.text()}`);
  }

  await page.waitForLoadState("networkidle");
}

/** Falha o teste se qualquer erro de console/página aparecer durante o teste. */
export function trackConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  return errors;
}
