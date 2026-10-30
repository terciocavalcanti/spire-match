import type { DevelopmentStatus, UnitStatus } from "@spire/contracts";

export const DEVELOPMENT_STATUS_LABELS: Record<DevelopmentStatus, string> = {
  DRAFT: "Rascunho",
  REVIEW: "Em revisão",
  PUBLISHED: "Publicado",
  ARCHIVED: "Arquivado",
};

export const UNIT_STATUS_LABELS: Record<UnitStatus, string> = {
  AVAILABLE: "Disponível",
  RESERVED: "Reservada",
  SOLD: "Vendida",
};
