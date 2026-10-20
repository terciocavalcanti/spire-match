import type { MatchWeights } from "./types";

// Peso-base inicial configurável — seção 4.3 do prompt mestre.
export const DEFAULT_MATCH_RULESET_VERSION = "1.0.0";

export const DEFAULT_MATCH_WEIGHTS: MatchWeights = {
  budget: 0.25,
  region: 0.2,
  proximity: 0.15, // só aplicado quando há localização válida
  area: 0.1,
  roomsFeatures: 0.1,
  purpose: 0.05,
  payment: 0.05,
  preferenceSignals: 0.1,
};

/**
 * Distância é fator contextual, não obrigação (seção 4.4). Quando a
 * localização do comprador está indisponível, o peso de `proximity` é
 * redistribuído proporcionalmente entre os demais fatores, de forma
 * determinística — o usuário nunca é penalizado por negar geolocalização.
 */
export function reweightWithoutProximity(weights: MatchWeights): Omit<MatchWeights, "proximity"> {
  const { proximity, ...rest } = weights;
  const remainingTotal = Object.values(rest).reduce((sum, w) => sum + w, 0);
  if (remainingTotal <= 0 || proximity <= 0) {
    return rest;
  }
  const entries = Object.entries(rest) as [keyof typeof rest, number][];
  const redistributed = entries.map(([key, value]) => {
    const share = value / remainingTotal;
    return [key, value + proximity * share] as const;
  });
  return Object.fromEntries(redistributed) as Omit<MatchWeights, "proximity">;
}
