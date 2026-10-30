import type { CommissionStatus } from "@spire/contracts";

export const COMMISSION_STATUS_LABELS: Record<CommissionStatus, string> = {
  PREVISTO: "Prevista",
  RECEBIDO: "Recebida",
  CANCELADO: "Cancelada",
};
