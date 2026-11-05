import { Body, Controller, HttpCode, Post, UseGuards } from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";

import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe";

import { grupoZapLeadPayloadSchema } from "./grupozap-lead-payload.schema";
import { GrupoZapLeadsService } from "./grupozap-leads.service";
import { GrupoZapWebhookAuthGuard } from "./grupozap-webhook-auth.guard";

/**
 * Webhook de terceiro (Grupo ZAP/OLX) — autenticado por Basic Auth própria
 * do provedor (ver GrupoZapWebhookAuthGuard), nunca por sessão de usuário.
 * Fica fora do Swagger público (não é um endpoint do nosso SDK).
 */
@ApiExcludeController()
@Controller("webhooks/grupozap")
@UseGuards(GrupoZapWebhookAuthGuard)
export class GrupoZapLeadsController {
  constructor(private readonly grupoZapLeads: GrupoZapLeadsService) {}

  @Post("leads")
  @HttpCode(200)
  async receiveLead(@Body(new ZodValidationPipe(grupoZapLeadPayloadSchema)) body: ReturnType<typeof grupoZapLeadPayloadSchema.parse>) {
    const result = await this.grupoZapLeads.receiveLead(body);
    return { received: true, ...result };
  }
}
