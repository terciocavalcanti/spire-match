"use client";

import { Bell, BellOff } from "lucide-react";
import { useEffect, useState } from "react";

import { apiClient } from "@/lib/api-client";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

type Status = "unsupported" | "no-vapid" | "denied" | "subscribed" | "available";

/**
 * Ativação sob demanda do Web Push — nunca pede permissão automaticamente ao
 * carregar a página (comportamento intrusivo); só no clique explícito do
 * usuário aqui no Perfil, seguindo o mesmo padrão do InstallPwaCard.
 */
export function PushNotificationsCard() {
  const [clientState, setClientState] = useState<{ ready: boolean; status: Status }>({ ready: false, status: "unsupported" });
  const [pending, setPending] = useState(false);

  useEffect(() => {
    void (async () => {
      if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
        setClientState({ ready: true, status: "unsupported" });
        return;
      }
      if (Notification.permission === "denied") {
        setClientState({ ready: true, status: "denied" });
        return;
      }
      const { publicKey } = await apiClient.notifications.vapidPublicKey().catch(() => ({ publicKey: null }));
      if (!publicKey) {
        setClientState({ ready: true, status: "no-vapid" });
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      setClientState({ ready: true, status: existing ? "subscribed" : "available" });
    })();
  }, []);

  async function subscribe() {
    setPending(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setClientState((s) => ({ ...s, status: "denied" }));
        return;
      }
      const { publicKey } = await apiClient.notifications.vapidPublicKey();
      if (!publicKey) {
        setClientState((s) => ({ ...s, status: "no-vapid" }));
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });
      const json = subscription.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) throw new Error("Assinatura push incompleta");
      await apiClient.notifications.subscribePush({
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
      });
      setClientState((s) => ({ ...s, status: "subscribed" }));
    } finally {
      setPending(false);
    }
  }

  async function unsubscribe() {
    setPending(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await apiClient.notifications.unsubscribePush(subscription.endpoint);
        await subscription.unsubscribe();
      }
      setClientState((s) => ({ ...s, status: "available" }));
    } finally {
      setPending(false);
    }
  }

  const { ready, status } = clientState;
  if (!ready || status === "unsupported" || status === "no-vapid") return null;

  return (
    <div className="rounded-2xl border border-border-subtle bg-background-elevated p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background-subtle text-ink-primary">
          {status === "subscribed" ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
        </div>
        <div className="flex-1">
          <p className="font-display text-bodyLg text-ink-primary">Notificações push</p>
          {status === "denied" ? (
            <p className="mt-1 text-bodySm text-ink-secondary">
              Permissão negada no navegador. Ative manualmente nas configurações do site para receber push.
            </p>
          ) : status === "subscribed" ? (
            <>
              <p className="mt-1 text-bodySm text-ink-secondary">Ativadas neste dispositivo.</p>
              <button
                type="button"
                onClick={() => void unsubscribe()}
                disabled={pending}
                className="mt-2 text-bodySm font-medium text-ink-primary underline"
              >
                {pending ? "Desativando…" : "Desativar"}
              </button>
            </>
          ) : (
            <>
              <p className="mt-1 text-bodySm text-ink-secondary">
                Receba avisos de matches, visitas e radares direto no seu navegador.
              </p>
              <button
                type="button"
                onClick={() => void subscribe()}
                disabled={pending}
                className="mt-2 rounded-pill bg-brand-charcoal px-4 py-2 text-bodySm font-semibold text-ink-inverse"
              >
                {pending ? "Ativando…" : "Ativar notificações"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
