import { Body, Controller, HttpCode, Post, UseGuards } from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";

import { GrupoZapLeadsService } from "./grupozap-leads.service";
import { GrupoZapWebhookAuthGuard } from "./grupozap-webhook-auth.guard";

/**
 * Webhook de terceiro (Grupo ZAP/OLX) — autenticado por Basic Auth própria
 * do provedor (ver GrupoZapWebhookAuthGuard), nunca por sessão de usuário.
 * Fica fora do Swagger público (não é um endpoint do nosso SDK).
 *
 * Nenhuma validação de schema acontece aqui de propósito: o corpo cru é
 * aceito e persistido sempre (ver GrupoZapLeadsService.receiveLead) antes de
 * qualquer tentativa de interpretá-lo — um payload que não bate 100% com o
 * schema esperado (ex.: lead sem e-mail, só com telefone) ainda fica salvo e
 * visível em "Conexões externas" como falha, nunca descartado com um 400.
 */
@ApiExcludeController()
@Controller("webhooks/grupozap")
@UseGuards(GrupoZapWebhookAuthGuard)
export class GrupoZapLeadsController {
  constructor(private readonly grupoZapLeads: GrupoZapLeadsService) {}

  @Post("leads")
  @HttpCode(200)
  async receiveLead(@Body() body: Record<string, unknown>) {
    const result = await this.grupoZapLeads.receiveLead(body);
    return { received: true, ...result };
  }
}
