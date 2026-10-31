import type { PrivateMarketOffer, PrivateMarketOfferAdmin } from "@spire/contracts";

import type { ownerLeads, privateMarketOffers } from "../database/schema";

type OfferRow = typeof privateMarketOffers.$inferSelect;
type OwnerLeadRow = typeof ownerLeads.$inferSelect;

export function toPrivateMarketOffer(offer: OfferRow, ownerLead: OwnerLeadRow): PrivateMarketOffer {
  return {
    id: offer.id,
    propertyType: ownerLead.propertyType,
    neighborhood: ownerLead.neighborhood,
    city: ownerLead.city,
    state: ownerLead.state,
    areaSqm: Number(ownerLead.areaSqm),
    bedrooms: ownerLead.bedrooms,
    parkingSpaces: ownerLead.parkingSpaces,
    minPrice: offer.minPrice ? Number(offer.minPrice) : null,
    anonymizedSummary: offer.anonymizedSummary ?? "",
    offerDeadline: offer.offerDeadline?.toISOString() ?? null,
    createdAt: offer.createdAt.toISOString(),
  };
}

export function toPrivateMarketOfferAdmin(offer: OfferRow): PrivateMarketOfferAdmin {
  return {
    id: offer.id,
    status: offer.status,
    minPrice: offer.minPrice ? Number(offer.minPrice) : null,
    anonymizedSummary: offer.anonymizedSummary,
    offerDeadline: offer.offerDeadline?.toISOString() ?? null,
    verifiedAt: offer.verifiedAt?.toISOString() ?? null,
    createdAt: offer.createdAt.toISOString(),
  };
}
