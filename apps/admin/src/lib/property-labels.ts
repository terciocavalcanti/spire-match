import type { ListingPurpose, PaymentMethod, PropertyStatus, PropertyType } from "@spire/contracts";

export const PROPERTY_STATUS_LABELS: Record<PropertyStatus, string> = {
  DRAFT: "Rascunho",
  AVAILABLE: "Disponível",
  RESERVED: "Reservado",
  SOLD: "Vendido",
  RENTED: "Alugado",
  INACTIVE: "Inativo",
};

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  APARTAMENTO: "Apartamento",
  CASA: "Casa",
  COBERTURA: "Cobertura",
};

export const LISTING_PURPOSE_LABELS: Record<ListingPurpose, string> = {
  MORAR: "Morar",
  INVESTIR: "Investir",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  A_VISTA: "À vista",
  FINANCIAMENTO: "Financiamento",
  CONSORCIO: "Consórcio",
  PERMUTA: "Permuta",
};
