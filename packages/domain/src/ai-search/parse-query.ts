import type { ListingPurpose, PropertyType } from "@spire/contracts";

export interface ParsedSearchIntent {
  priceMin?: number;
  priceMax?: number;
  bedroomsMin?: number;
  neighborhoods: string[];
  type?: PropertyType;
  purpose?: ListingPurpose;
  /** Trechos reconhecidos — usados para montar a explicação exibida ao usuário. */
  matchedTerms: string[];
}

const TYPE_KEYWORDS: Record<string, PropertyType> = {
  apartamento: "APARTAMENTO",
  apto: "APARTAMENTO",
  casa: "CASA",
  cobertura: "COBERTURA",
};

const PURPOSE_KEYWORDS: Array<{ pattern: RegExp; purpose: ListingPurpose }> = [
  { pattern: /\b(morar|moradia|residir)\b/, purpose: "MORAR" },
  { pattern: /\b(investir|investimento|alugar|locação|renda)\b/, purpose: "INVESTIR" },
];

// Um valor monetário: dígitos (formato BR, "." como milhar e "," como decimal)
// seguido opcionalmente de "mil"/"milhão"/"milhões". "milh[aã]o|milh[oõ]es" vem
// antes de "mil" na alternância — senão "mil" casaria só o prefixo de "milhão".
const MONEY_PATTERN = "(?:r\\$\\s*)?(\\d{1,3}(?:\\.\\d{3})*(?:,\\d+)?|\\d+(?:,\\d+)?)\\s*(milh[aã]o|milh[oõ]es|mil)?";
const MONEY_TOKEN = new RegExp(MONEY_PATTERN, "gi");

/** Converte um número no formato brasileiro ("1.300.000", "1,3", "800") para float. */
function parseBrazilianAmount(raw: string, suffix: string | undefined): number | null {
  const normalized = raw.replace(/\./g, "").replace(",", ".");
  const value = Number.parseFloat(normalized);
  if (Number.isNaN(value)) return null;

  if (suffix) {
    const s = suffix.toLowerCase();
    if (s === "mil") return value * 1_000;
    if (s.startsWith("milh")) return value * 1_000_000;
  }
  return value;
}

/** Extrai o primeiro valor monetário de um trecho de texto, exigindo "R$" ou sufixo mil/milhão (evita confundir com "3 quartos"). */
function extractAmount(text: string): { amount: number; matched: string } | null {
  MONEY_TOKEN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = MONEY_TOKEN.exec(text))) {
    const [full, numberPart, suffix] = match;
    if (!numberPart) continue;
    const hasCurrencyPrefix = /r\$/i.test(full);
    if (!hasCurrencyPrefix && !suffix) continue; // número solto sem contexto monetário — ignora
    const amount = parseBrazilianAmount(numberPart, suffix);
    if (amount !== null) return { amount, matched: full.trim() };
  }
  return null;
}

/**
 * Parser determinístico de intenção de busca em linguagem natural (pt-BR).
 * Serve como fallback sempre disponível do AI Concierge (seção 4.10 do
 * prompt mestre) — funciona sem qualquer provedor de LLM configurado, e
 * nunca inventa imóveis: apenas produz filtros estruturados para a busca
 * real no catálogo.
 */
export function parseSearchQuery(query: string, knownNeighborhoods: string[]): ParsedSearchIntent {
  const lower = query.toLowerCase();
  const matchedTerms: string[] = [];

  let priceMin: number | undefined;
  let priceMax: number | undefined;

  const rangeMatch = lower.match(new RegExp(`entre\\s+${MONEY_PATTERN}\\s+e\\s+${MONEY_PATTERN}`, "i"));
  if (rangeMatch) {
    const min = parseBrazilianAmount(rangeMatch[1]!, rangeMatch[2]);
    const max = parseBrazilianAmount(rangeMatch[3]!, rangeMatch[4]);
    if (min !== null) {
      priceMin = min;
      matchedTerms.push(rangeMatch[0]);
    }
    if (max !== null) {
      priceMax = max;
    }
  } else {
    const maxContext = lower.match(
      new RegExp(`(?:até|no máximo|máximo de|abaixo de|menos de)\\s+${MONEY_PATTERN}`, "i"),
    );
    if (maxContext) {
      const found = parseBrazilianAmount(maxContext[1]!, maxContext[2]);
      if (found !== null) {
        priceMax = found;
        matchedTerms.push(maxContext[0]);
      }
    }
    const minContext = lower.match(
      new RegExp(`(?:a partir de|mínimo de|acima de|mais de)\\s+${MONEY_PATTERN}`, "i"),
    );
    if (minContext) {
      const found = parseBrazilianAmount(minContext[1]!, minContext[2]);
      if (found !== null) {
        priceMin = found;
        matchedTerms.push(minContext[0]);
      }
    }
    if (priceMin === undefined && priceMax === undefined) {
      const found = extractAmount(lower);
      if (found) {
        priceMax = found.amount;
        matchedTerms.push(found.matched);
      }
    }
  }

  const bedroomsMatch = lower.match(/(\d+)\s*(?:quartos?|dormit[oó]rios?)/);
  const bedroomsMin = bedroomsMatch ? Number.parseInt(bedroomsMatch[1]!, 10) : undefined;
  if (bedroomsMatch) matchedTerms.push(bedroomsMatch[0]);

  const neighborhoods = knownNeighborhoods.filter((n) => lower.includes(n.toLowerCase()));
  neighborhoods.forEach((n) => matchedTerms.push(n));

  let type: PropertyType | undefined;
  for (const [keyword, value] of Object.entries(TYPE_KEYWORDS)) {
    if (lower.includes(keyword)) {
      type = value;
      matchedTerms.push(keyword);
      break;
    }
  }

  let purpose: ListingPurpose | undefined;
  for (const { pattern, purpose: value } of PURPOSE_KEYWORDS) {
    if (pattern.test(lower)) {
      purpose = value;
      matchedTerms.push(pattern.exec(lower)?.[0] ?? "");
      break;
    }
  }

  return { priceMin, priceMax, bedroomsMin, neighborhoods, type, purpose, matchedTerms };
}
