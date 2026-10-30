// Nomes de fila compartilhados "por convenção" com apps/api/src/queue/queue.service.ts
// (produtor) — mantidos como constantes simples duplicadas nos dois lados em
// vez de um pacote novo só para 3 strings; qualquer mudança aqui precisa
// espelhar lá.
export const QUEUE_RECALC_BUYER = "match-recalc-buyer";
export const QUEUE_RECALC_PROPERTY = "match-recalc-property";
export const QUEUE_RADAR_SWEEP = "radar-sweep";

export interface RecalcBuyerPayload {
  userId: string;
}

export interface RecalcPropertyPayload {
  propertyId: string;
}

// O job de sweep não recebe payload — sempre varre todos os radares ativos.
export type RadarSweepPayload = Record<string, never>;
