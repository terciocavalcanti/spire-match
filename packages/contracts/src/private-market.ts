import { z } from "zod";

import { propertyTypeSchema } from "./property";

// Mercado Privado (seção 4.8 do prompt mestre): ofertas off-market,
// anonimizadas, ligadas a uma captação (owner_leads) em vez de a um imóvel
// público. PENDENTE_VERIFICACAO até o time comercial preencher o resumo
// anonimizado + preço mínimo e marcar ELEGIVEL (ou INATIVO).
export const PRIVATE_MARKET_OFFER_STATUSES = ["PENDENTE_VERIFICACAO", "ELEGIVEL", "INATIVO"] as const;
export const privateMarketOfferStatusSchema = z.enum(PRIVATE_MARKET_OFFER_STATUSES);
export type PrivateMarketOfferStatus = z.infer<typeof privateMarketOfferStatusSchema>;

/**
 * Card público — deliberadamente sem nada identificável: sem endereço
 * exato, sem fotos, sem nome do proprietário. Só é retornado quando
 * status=ELEGIVEL; contato é sempre intermediado pela VALORI.
 */
export const privateMarketOfferSchema = z.object({
  id: z.string().uuid(),
  propertyType: propertyTypeSchema,
  neighborhood: z.string(),
  city: z.string(),
  state: z.string(),
  areaSqm: z.number(),
  bedrooms: z.number().int(),
  parkingSpaces: z.number().int(),
  minPrice: z.number().nullable(),
  anonymizedSummary: z.string(),
  offerDeadline: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});
export type PrivateMarketOffer = z.infer<typeof privateMarketOfferSchema>;

export const privateMarketOfferListQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  city: z.string().trim().min(1).optional(),
});
export type PrivateMarketOfferListQuery = z.infer<typeof privateMarketOfferListQuerySchema>;

/** Visão administrativa — embutida no detalhe de Proprietários (E1), nunca uma tela própria. */
export const privateMarketOfferAdminSchema = z.object({
  id: z.string().uuid(),
  status: privateMarketOfferStatusSchema,
  minPrice: z.number().nullable(),
  anonymizedSummary: z.string().nullable(),
  offerDeadline: z.string().datetime().nullable(),
  verifiedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});
export type PrivateMarketOfferAdmin = z.infer<typeof privateMarketOfferAdminSchema>;

export const verifyPrivateMarketOfferRequestSchema = z.object({
  status: z.enum(["ELEGIVEL", "INATIVO"]),
  anonymizedSummary: z.string().trim().max(600).optional(),
  minPrice: z.number().positive().nullable().optional(),
  offerDeadline: z.string().datetime().nullable().optional(),
});
export type VerifyPrivateMarketOfferRequest = z.infer<typeof verifyPrivateMarketOfferRequestSchema>;

export const requestPrivateMarketContactRequestSchema = z.object({
  message: z.string().trim().max(1000).default(""),
});
export type RequestPrivateMarketContactRequest = z.infer<typeof requestPrivateMarketContactRequestSchema>;
