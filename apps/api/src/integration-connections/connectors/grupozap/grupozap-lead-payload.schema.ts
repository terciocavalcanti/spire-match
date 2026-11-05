import { z } from "zod";

/**
 * Payload do webhook de leads do Grupo ZAP/OLX (ZAP Imóveis, Viva Real e OLX
 * compartilham o mesmo backend de leads). Campos e obrigatoriedade conforme
 * documentação oficial lida em developers.grupozap.com/webhooks/integration_leads.html
 * em 2026-11-05 — ver docs/product/NOVOS_RECURSOS_PROGRESSO.md para a fonte.
 *
 * `extraData` e o sub-objeto `mcmv` não têm todos os campos marcados como
 * sempre presentes na documentação — modelados como passthrough em vez de
 * schema estrito, para nunca rejeitar um lead real por um campo opcional
 * ausente que não documentamos.
 */
export const grupoZapLeadPayloadSchema = z
  .object({
    leadOrigin: z.string(),
    timestamp: z.string(),
    originLeadId: z.string().min(1),
    originListingId: z.string().optional(),
    clientListingId: z.string().optional(),
    name: z.string().min(1),
    email: z.string().email(),
    ddd: z.string().optional(),
    phone: z.string().optional(),
    phoneNumber: z.string().optional(),
    message: z.string().optional(),
    temperature: z.enum(["Baixa", "Média", "Alta"]).optional(),
    transactionType: z.enum(["RENT", "SELL"]).optional(),
    extraData: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();
export type GrupoZapLeadPayload = z.infer<typeof grupoZapLeadPayloadSchema>;
