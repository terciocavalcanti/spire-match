import type { OwnerLeadActivityType, OwnerLeadIntent, OwnerLeadStage } from "@spire/contracts";

export const OWNER_LEAD_STAGE_LABELS: Record<OwnerLeadStage, string> = {
  NOVO: "Novo",
  TRIAGEM: "Triagem",
  APROVADO: "Aprovado",
  REJEITADO: "Rejeitado",
  CONVERTIDO: "Convertido",
};

export const OWNER_LEAD_STAGE_CLASSES: Record<OwnerLeadStage, string> = {
  NOVO: "bg-background-subtle text-ink-secondary",
  TRIAGEM: "bg-status-warmBg text-status-warm",
  APROVADO: "bg-status-successBg text-status-success",
  REJEITADO: "bg-status-dangerBg text-status-danger",
  CONVERTIDO: "bg-status-successBg text-status-success",
};

export const OWNER_LEAD_INTENT_LABELS: Record<OwnerLeadIntent, string> = {
  VENDER: "Vender",
  ALUGAR: "Alugar",
  ACEITAR_PROPOSTA: "Avaliar proposta",
};

export const OWNER_LEAD_ACTIVITY_LABELS: Record<OwnerLeadActivityType, string> = {
  CREATED: "Captação criada",
  STAGE_CHANGED: "Estágio alterado",
  ASSIGNED: "Corretor atribuído",
  NOTE: "Nota interna",
  PUBLISHED: "Publicado no catálogo",
};
