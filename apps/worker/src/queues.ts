// Nomes de fila compartilhados "por convenção" com apps/api/src/queue/queue.service.ts
// (produtor) — mantidos como constantes simples duplicadas nos dois lados em
// vez de um pacote novo só para 3 strings; qualquer mudança aqui precisa
// espelhar lá.
export const QUEUE_RECALC_BUYER = "match-recalc-buyer";
export const QUEUE_RECALC_PROPERTY = "match-recalc-property";
export const QUEUE_RADAR_SWEEP = "radar-sweep";
export const QUEUE_AUTOMATION_TICK = "automation-tick";
export const QUEUE_INTEGRATION_EVENTS_RETRY = "integration-events-retry";

export interface RecalcBuyerPayload {
  userId: string;
}

export interface RecalcPropertyPayload {
  propertyId: string;
}

// O job de sweep não recebe payload — sempre varre todos os radares ativos.
export type RadarSweepPayload = Record<string, never>;

// Idem para o tick de automações — roda as regras habilitadas (D4).
export type AutomationTickPayload = Record<string, never>;

// Idem — varre eventos FALHOU de todas as conexões (fundação de integrações, M1).
export type IntegrationEventsRetryPayload = Record<string, never>;
