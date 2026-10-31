import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { privateMarketOfferListQuerySchema, requestPrivateMarketContactRequestSchema, verifyPrivateMarketOfferRequestSchema } from "@spire/contracts";

import { CurrentUserId } from "../auth/decorators/current-user-id.decorator";
import { SessionAuthGuard } from "../auth/guards/session-auth.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";

import { PrivateMarketService } from "./private-market.service";

const CRM_ROLES = ["ADMIN", "SUPER_ADMIN", "SALES_MANAGER"] as const;

@ApiTags("private-market")
@Controller("private-market")
export class PrivateMarketController {
  constructor(private readonly privateMarket: PrivateMarketService) {}

  @Get()
  async list(@Query(new ZodValidationPipe(privateMarketOfferListQuerySchema)) query: ReturnType<typeof privateMarketOfferListQuerySchema.parse>) {
    return this.privateMarket.list(query);
  }

  @Get("by-owner-lead/:ownerLeadId")
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles(...CRM_ROLES)
  async getByOwnerLeadId(@Param("ownerLeadId") ownerLeadId: string) {
    // Nest não serializa um retorno `null` como JSON (envia corpo vazio sem
    // Content-Type) — envolvido em objeto para o cliente sempre receber JSON válido.
    const offer = await this.privateMarket.getByOwnerLeadId(ownerLeadId);
    return { offer };
  }

  @Patch(":id/verify")
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles(...CRM_ROLES)
  async verify(
    @Param("id") id: string,
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(verifyPrivateMarketOfferRequestSchema)) body: ReturnType<typeof verifyPrivateMarketOfferRequestSchema.parse>,
  ) {
    return this.privateMarket.verify(id, userId, body);
  }

  @Post(":id/request-contact")
  @UseGuards(SessionAuthGuard)
  async requestContact(
    @Param("id") id: string,
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(requestPrivateMarketContactRequestSchema)) body: ReturnType<typeof requestPrivateMarketContactRequestSchema.parse>,
  ) {
    await this.privateMarket.requestContact(id, userId, body);
    return { ok: true };
  }
}
