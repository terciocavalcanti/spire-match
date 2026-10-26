import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import type { GenerateTourRequest, Tour } from "@spire/contracts";
import { buildNearestNeighborRoute } from "@spire/domain";
import { inArray } from "drizzle-orm";

import type { Database } from "../database/client";
import { DATABASE } from "../database/database.module";
import { properties } from "../database/schema";
import { MatchesService } from "../matches/matches.service";
import { toPropertySummary } from "../properties/property-mapper";

@Injectable()
export class ToursService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly matches: MatchesService,
  ) {}

  async generate(userId: string, request: GenerateTourRequest): Promise<Tour> {
    const rows = await this.db.select().from(properties).where(inArray(properties.id, request.propertyIds));

    const withoutLocation = rows.filter((r) => r.lat === null || r.lng === null);
    if (withoutLocation.length > 0) {
      throw new BadRequestException({
        code: "PROPERTY_MISSING_LOCATION",
        message: "Um ou mais imóveis selecionados não têm localização cadastrada para montar o roteiro",
      });
    }
    if (rows.length !== request.propertyIds.length) {
      throw new BadRequestException({ code: "PROPERTY_NOT_FOUND", message: "Um ou mais imóveis não foram encontrados" });
    }

    const byId = new Map(rows.map((r) => [r.id, r]));
    const matchResults = await this.matches.computeForPropertyIds(userId, request.propertyIds, null);

    const route = buildNearestNeighborRoute(
      rows.map((r) => ({ id: r.id, location: { lat: r.lat!, lng: r.lng! } })),
    );

    return {
      stops: route.stops.map((stop) => {
        const property = byId.get(stop.id)!;
        return {
          order: stop.order,
          property: toPropertySummary(property),
          score: matchResults.get(stop.id)?.score ?? null,
          distanceFromPreviousMeters: stop.distanceFromPreviousMeters,
        };
      }),
      totalDistanceMeters: route.totalDistanceMeters,
    };
  }
}
