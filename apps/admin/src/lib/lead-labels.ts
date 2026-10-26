import type { LeadActivityType, LeadStage, LeadTemperature } from "@spire/contracts";

export const LEAD_STAGE_LABELS: Record<LeadStage, string> = {
  NOVO: "Novo",
  QUALIFICANDO: "Qualificando",
  INTERESSE: "Interesse",
  VISITA: "Visita",
  PROPOSTA: "Proposta",
  NEGOCIACAO: "Negociação",
  GANHO: "Ganho",
  PERDIDO: "Perdido",
};

export const LEAD_TEMPERATURE_LABELS: Record<LeadTemperature, string> = {
  FRIO: "Frio",
  MORNO: "Morno",
  QUENTE: "Quente",
};

export const LEAD_TEMPERATURE_CLASSES: Record<LeadTemperature, string> = {
  FRIO: "bg-background-subtle text-ink-secondary",
  MORNO: "bg-status-warmBg text-status-warm",
  QUENTE: "bg-status-hotBg text-status-hot",
};

export const LEAD_ACTIVITY_LABELS: Record<LeadActivityType, string> = {
  CREATED: "Lead criado",
  STAGE_CHANGED: "Estágio alterado",
  CONTACT: "Contato iniciado",
  VISIT_SCHEDULED: "Visita agendada",
  VISIT_CANCELLED: "Visita cancelada",
  PROPOSAL_RECEIVED: "Proposta recebida",
  ASSIGNED: "Corretor atribuído",
  NOTE: "Nota interna",
};
