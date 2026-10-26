export const LEAD_TEMPERATURES = ["FRIO", "MORNO", "QUENTE"] as const;
export type LeadTemperature = (typeof LEAD_TEMPERATURES)[number];

export interface LeadSignals {
  viewsCount: number;
  favoritesCount: number;
  hasContact: boolean;
  hasScheduledVisit: boolean;
  hasProposal: boolean;
}

export interface LeadScoreResult {
  score: number;
  temperature: LeadTemperature;
}

/**
 * Lead Score — prioriza o time comercial, distinto do Match Score (que mede
 * compatibilidade comprador-imóvel). Soma pontos por sinal real de intenção
 * de compra, nunca aleatório/inventado. Pesos documentados e fixos: contato
 * com corretor (20), visita agendada (25), proposta enviada (35) são os
 * sinais fortes; visualizações e favoritos (até 10 cada) são sinais fracos.
 */
/** Mesmos limiares usados por `computeLeadScore` — reaproveitada ao ler um
 * score já persistido no banco, sem precisar refazer o cálculo dos sinais. */
export function temperatureFromScore(score: number): LeadTemperature {
  return score >= 60 ? "QUENTE" : score >= 30 ? "MORNO" : "FRIO";
}

export function computeLeadScore(signals: LeadSignals): LeadScoreResult {
  const viewsPoints = Math.min(signals.viewsCount * 1, 10);
  const favoritesPoints = Math.min(signals.favoritesCount * 2, 10);
  const contactPoints = signals.hasContact ? 20 : 0;
  const visitPoints = signals.hasScheduledVisit ? 25 : 0;
  const proposalPoints = signals.hasProposal ? 35 : 0;

  const score = Math.min(100, viewsPoints + favoritesPoints + contactPoints + visitPoints + proposalPoints);

  return { score, temperature: temperatureFromScore(score) };
}
