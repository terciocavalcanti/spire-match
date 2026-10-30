import type { WorkerEnv } from "./env";

/**
 * Chama de volta um endpoint interno de apps/api. Lança em respostas não-2xx
 * para que o BullMQ aplique o backoff/retry configurado no job — o worker
 * nunca reimplementa a lógica de negócio, só agenda e repassa.
 */
export async function callInternalApi(env: WorkerEnv, path: string): Promise<unknown> {
  const response = await fetch(`${env.API_INTERNAL_URL}${path}`, {
    method: "POST",
    headers: { "x-internal-key": env.INTERNAL_API_KEY, "content-type": "application/json" },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Chamada interna falhou (${response.status} ${path}): ${body.slice(0, 300)}`);
  }

  return response.json().catch(() => ({}));
}
