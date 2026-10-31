import { Controller, Param, Post, UseGuards } from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";

import { AutomationsService } from "../automations/automations.service";
import { InternalGuard } from "../common/guards/internal.guard";
import { MatchesService } from "../matches/matches.service";
import { RadarsService } from "../radars/radars.service";

/**
 * Rotas chamadas só pelo apps/worker (ver InternalGuard) — nunca pelo
 * navegador. Cada rota reaproveita o service já existente, sem duplicar
 * lógica de negócio entre o caminho síncrono (HTTP comum) e o assíncrono
 * (fila BullMQ).
 */
@ApiExcludeController()
@Controller("internal")
@UseGuards(InternalGuard)
export class InternalController {
  constructor(
    private readonly matches: MatchesService,
    private readonly radars: RadarsService,
    private readonly automations: AutomationsService,
  ) {}

  @Post("matches/recalculate-buyer/:userId")
  async recalculateBuyer(@Param("userId") userId: string) {
    const results = await this.matches.computeAllForUser(userId, null);
    return { recalculated: results.length };
  }

  @Post("matches/recalculate-property/:propertyId")
  async recalculateProperty(@Param("propertyId") propertyId: string) {
    return this.matches.recalculateForProperty(propertyId);
  }

  @Post("radars/sweep")
  async sweepRadars() {
    return this.radars.sweep();
  }

  @Post("automations/tick")
  async automationsTick() {
    const [leadAutoAssigned, slaReminded] = await Promise.all([
      this.automations.runLeadAutoAssign(),
      this.automations.runSlaReminders(),
    ]);
    return { leadAutoAssigned, slaReminded };
  }
}
