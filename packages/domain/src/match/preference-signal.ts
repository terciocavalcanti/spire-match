import type { PropertyMatchInput } from "./types";

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** Um imóvel com o qual o comprador demonstrou preferência real (LIKE ou FAVORITE). */
export interface PreferenceSignalSample {
  neighborhood: string;
  price: number;
  bedrooms: number;
  features: string[];
}

const NEIGHBORHOOD_WEIGHT = 0.4;
const PRICE_WEIGHT = 0.3;
const BEDROOMS_WEIGHT = 0.15;
const FEATURES_WEIGHT = 0.15;

/**
 * Score 0..1 de quão parecido um imóvel candidato é dos imóveis que o
 * comprador já demonstrou preferir — alimenta o peso "sinais de preferência"
 * do Match Engine (`computeMatchScore`, peso `preferenceSignals`). Puro e
 * determinístico, sem I/O: quem reúne as amostras (consulta a
 * `user_interactions`/`favorites`) é o chamador (`MatchesService`).
 *
 * Sem amostras, devolve 0.5 (neutro) — nunca penaliza nem favorece quem
 * ainda não interagiu com nada.
 */
export function computePreferenceSignalScore(samples: PreferenceSignalSample[], candidate: PropertyMatchInput): number {
  if (samples.length === 0) return 0.5;

  const neighborhoodScore = samples.filter((s) => s.neighborhood === candidate.neighborhood).length / samples.length;

  const avgPrice = samples.reduce((sum, s) => sum + s.price, 0) / samples.length;
  const priceScore = avgPrice > 0 ? clamp01(1 - Math.abs(candidate.price - avgPrice) / avgPrice) : 0.5;

  const avgBedrooms = samples.reduce((sum, s) => sum + s.bedrooms, 0) / samples.length;
  const bedroomsScore = avgBedrooms > 0 ? clamp01(1 - Math.abs(candidate.bedrooms - avgBedrooms) / avgBedrooms) : 0.5;

  // Fração das características DO CANDIDATO que aparecem no que o comprador
  // curtiu — não o inverso. Dividir pelo tamanho do conjunto curtido (em vez
  // de pelas características do candidato) penaliza demais um candidato com
  // poucas características quando o histórico de curtidas acumula muitas
  // características distintas — confirmado com dados reais de seed, onde um
  // candidato com 2 características e 1 em comum caía de ~0.80 para ~0.75
  // (just abaixo do limiar de explicação) só por causa dessa divisão errada.
  const likedFeatures = new Set(samples.flatMap((s) => s.features));
  const featuresScore =
    candidate.features.length === 0 ? 0.5 : candidate.features.filter((f) => likedFeatures.has(f)).length / candidate.features.length;

  return clamp01(
    neighborhoodScore * NEIGHBORHOOD_WEIGHT +
      priceScore * PRICE_WEIGHT +
      bedroomsScore * BEDROOMS_WEIGHT +
      featuresScore * FEATURES_WEIGHT,
  );
}

export const INFERRED_PREFERENCE_TYPES = ["NEIGHBORHOOD", "FEATURE"] as const;
export type InferredPreferenceType = (typeof INFERRED_PREFERENCE_TYPES)[number];

export interface InferredPreferenceSuggestion {
  type: InferredPreferenceType;
  value: string;
  sampleCount: number;
  confidence: number;
}

// Nunca sugere com menos de 3 sinais reais — evita "preferência" baseada em
// uma curtida isolada. Confiança mínima de 40% dos sinais analisados evita
// ruído: um bairro que aparece em 1 de 10 curtidas não é padrão, é acaso.
const MIN_SAMPLE_COUNT = 3;
const MIN_CONFIDENCE = 0.4;
const MAX_SUGGESTIONS = 3;

/**
 * Hipóteses de preferência derivadas do comportamento real (LIKE/FAVORITE),
 * nunca escritas automaticamente no perfil confirmado (`buyer_profiles`) —
 * só retornadas para o comprador revisar e confirmar explicitamente (seção
 * 4.3 do prompt mestre: "sugestões revisáveis e confirmação do usuário").
 * Exclui o que já está confirmado, para nunca sugerir o óbvio.
 */
export function inferPreferenceSuggestions(
  samples: PreferenceSignalSample[],
  confirmed: { desiredNeighborhoods: string[]; desiredFeatures: string[] },
): InferredPreferenceSuggestion[] {
  if (samples.length < MIN_SAMPLE_COUNT) return [];

  const neighborhoodCounts = new Map<string, number>();
  const featureCounts = new Map<string, number>();
  for (const sample of samples) {
    neighborhoodCounts.set(sample.neighborhood, (neighborhoodCounts.get(sample.neighborhood) ?? 0) + 1);
    for (const feature of sample.features) {
      featureCounts.set(feature, (featureCounts.get(feature) ?? 0) + 1);
    }
  }

  const suggestions: InferredPreferenceSuggestion[] = [];
  for (const [neighborhood, count] of neighborhoodCounts) {
    if (confirmed.desiredNeighborhoods.includes(neighborhood)) continue;
    const confidence = count / samples.length;
    if (count >= MIN_SAMPLE_COUNT && confidence >= MIN_CONFIDENCE) {
      suggestions.push({ type: "NEIGHBORHOOD", value: neighborhood, sampleCount: count, confidence });
    }
  }
  for (const [feature, count] of featureCounts) {
    if (confirmed.desiredFeatures.includes(feature)) continue;
    const confidence = count / samples.length;
    if (count >= MIN_SAMPLE_COUNT && confidence >= MIN_CONFIDENCE) {
      suggestions.push({ type: "FEATURE", value: feature, sampleCount: count, confidence });
    }
  }

  return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, MAX_SUGGESTIONS);
}
