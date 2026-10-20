import { Inject, Injectable } from "@nestjs/common";
import type { AiSearchResponse } from "@spire/contracts";
import { parseSearchQuery } from "@spire/domain";
import { sql } from "drizzle-orm";

import type { Database } from "../database/client";
import { DATABASE } from "../database/database.module";
import { properties } from "../database/schema";
import { PropertiesService } from "../properties/properties.service";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const TYPE_LABELS: Record<string, string> = { APARTAMENTO: "apartamento", CASA: "casa", COBERTURA: "cobertura" };

/**
 * AI Concierge (seção 4.10 do prompt mestre). Sem provedor de LLM
 * configurado, usa o parser determinístico de `packages/domain` como
 * fallback sempre disponível — nunca gera SQL dinâmico nem inventa
 * imóveis: o parser só produz filtros estruturados, e a busca real roda
 * por `PropertiesService.search`, a mesma usada pela tela Explorar.
 */
@Injectable()
export class AiSearchService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly propertiesService: PropertiesService,
  ) {}

  private async knownNeighborhoods(): Promise<string[]> {
    const rows = await this.db
      .selectDistinct({ neighborhood: properties.neighborhood })
      .from(properties)
      .where(sql`${properties.status} = 'AVAILABLE'`);
    return rows.map((r) => r.neighborhood);
  }

  private buildExplanation(intent: ReturnType<typeof parseSearchQuery>, resultCount: number): string {
    const parts: string[] = [];
    if (intent.type) parts.push(TYPE_LABELS[intent.type] ?? intent.type.toLowerCase());
    if (intent.bedroomsMin) parts.push(`${intent.bedroomsMin}+ quartos`);
    if (intent.neighborhoods.length) parts.push(`em ${intent.neighborhoods.join(" ou ")}`);
    if (intent.priceMax) parts.push(`até ${currencyFormatter.format(intent.priceMax)}`);
    if (intent.priceMin) parts.push(`a partir de ${currencyFormatter.format(intent.priceMin)}`);
    if (intent.purpose) parts.push(intent.purpose === "MORAR" ? "para morar" : "para investir");

    if (parts.length === 0) {
      return `Não identifiquei critérios específicos no seu pedido — mostrando os ${resultCount} imóveis disponíveis mais recentes.`;
    }
    return `Entendi: ${parts.join(", ")}. Encontrei ${resultCount} imóve${resultCount === 1 ? "l" : "is"} compatíve${resultCount === 1 ? "l" : "is"}.`;
  }

  async search(query: string): Promise<AiSearchResponse> {
    const neighborhoods = await this.knownNeighborhoods();
    const intent = parseSearchQuery(query, neighborhoods);

    const { items } = await this.propertiesService.search({
      limit: 20,
      type: intent.type,
      purpose: intent.purpose,
      neighborhoods: intent.neighborhoods.length ? intent.neighborhoods : undefined,
      priceMin: intent.priceMin,
      priceMax: intent.priceMax,
      bedroomsMin: intent.bedroomsMin,
    });

    return {
      explanation: this.buildExplanation(intent, items.length),
      filters: {
        priceMin: intent.priceMin ?? null,
        priceMax: intent.priceMax ?? null,
        bedroomsMin: intent.bedroomsMin ?? null,
        neighborhoods: intent.neighborhoods,
        type: intent.type ?? null,
        purpose: intent.purpose ?? null,
      },
      items,
      provider: "DETERMINISTIC",
    };
  }
}
