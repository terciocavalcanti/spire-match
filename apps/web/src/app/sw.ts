import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { NetworkOnly, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  // navigationPreload desligado: em teste real (offline via DevTools/Playwright),
  // a navigation preload request falha e isso interrompe a cadeia de fallback do
  // Workbox/Serwist antes de chegar ao cache/offline — a navegação inteira falha
  // com ERR_FAILED em vez de cair para a página /offline. Sem preload, o fallback
  // funciona corretamente; o custo é perder um ganho de performance menor.
  navigationPreload: false,
  runtimeCaching: [
    // Requisições cross-origin (API em outro domínio, mapas, etc.) nunca
    // passam pelo cache do service worker — cobre a API de autenticação e
    // qualquer dado pessoal, conforme seção 10 do prompt mestre.
    {
      matcher: ({ sameOrigin }) => !sameOrigin,
      handler: new NetworkOnly(),
    },
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();
