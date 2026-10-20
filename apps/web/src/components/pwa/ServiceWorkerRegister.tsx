"use client";

import { useEffect } from "react";

/** Registra o service worker gerado pelo Serwist (public/sw.js). */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch((error: unknown) => {
      console.error("Falha ao registrar o service worker:", error);
    });
  }, []);

  return null;
}
