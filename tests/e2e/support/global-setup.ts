import { chromium } from "@playwright/test";

import { login } from "./auth";
import { ADMIN_URL, DEMO_ADMIN, DEMO_BUYER, WEB_URL } from "./urls";

/**
 * Autentica uma única vez por papel e salva o cookie de sessão em disco
 * (storageState) — os specs reutilizam esse estado em vez de logar de novo
 * a cada teste. Necessário porque POST /auth/login tem throttle agressivo
 * (poucas tentativas por minuto, proposital contra força bruta): logar em
 * cada teste individualmente estoura esse limite e derruba a suíte inteira.
 */
export default async function globalSetup(): Promise<void> {
  const browser = await chromium.launch();

  const buyerContext = await browser.newContext();
  const buyerPage = await buyerContext.newPage();
  await login(buyerPage, WEB_URL, DEMO_BUYER.email, DEMO_BUYER.password);
  await buyerContext.storageState({ path: "support/.auth/buyer.json" });
  await buyerContext.close();

  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  await login(adminPage, ADMIN_URL, DEMO_ADMIN.email, DEMO_ADMIN.password);
  await adminContext.storageState({ path: "support/.auth/admin.json" });
  await adminContext.close();

  await browser.close();
}
