import { Body, Controller, Get, Patch, UnprocessableEntityException, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import {
  type PlatformSettings,
  updateCommissionRateRequestSchema,
  updateDataRetentionDaysRequestSchema,
  updateDemandMatchThresholdRequestSchema,
  updateMatchWeightsRequestSchema,
  updateRadarSweepIntervalRequestSchema,
} from "@spire/contracts";

import { AuditLogService } from "../audit/audit-log.service";
import { CurrentUserId } from "../auth/decorators/current-user-id.decorator";
import { SessionAuthGuard } from "../auth/guards/session-auth.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { MatchesService } from "../matches/matches.service";

import { SettingsService } from "./settings.service";

// Mudar como o Match Engine pontua ou a comissão padrão é sensível —
// restrito a ADMIN/SUPER_ADMIN, mais estrito que ADMIN_CATALOG_ROLES.
const SETTINGS_ROLES = ["ADMIN", "SUPER_ADMIN"] as const;

const WEIGHT_SUM_TOLERANCE = 0.01;

@ApiTags("settings")
@Controller("settings")
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles(...SETTINGS_ROLES)
export class SettingsController {
  constructor(
    private readonly settings: SettingsService,
    private readonly matches: MatchesService,
    private readonly auditLog: AuditLogService,
  ) {}

  @Get()
  async get(): Promise<PlatformSettings> {
    const [{ weights, isDefault }, commissionDefaultRate, radarSweepIntervalMinutes, demandMatchThreshold, dataRetentionDays] = await Promise.all([
      this.settings.getMatchWeights(),
      this.settings.getCommissionRate(),
      this.settings.getRadarSweepIntervalMinutes(),
      this.settings.getDemandMatchThreshold(),
      this.settings.getDataRetentionDays(),
    ]);
    return { matchWeights: weights, matchWeightsIsDefault: isDefault, commissionDefaultRate, radarSweepIntervalMinutes, demandMatchThreshold, dataRetentionDays };
  }

  @Patch("match-weights")
  async updateMatchWeights(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(updateMatchWeightsRequestSchema)) body: ReturnType<typeof updateMatchWeightsRequestSchema.parse>,
  ) {
    const sum = Object.values(body.weights).reduce((acc, v) => acc + v, 0);
    if (Math.abs(sum - 1) > WEIGHT_SUM_TOLERANCE) {
      throw new UnprocessableEntityException({
        code: "WEIGHTS_MUST_SUM_TO_ONE",
        message: `Os pesos devem somar 100% (soma atual: ${Math.round(sum * 100)}%)`,
      });
    }

    await this.settings.set("matchWeights", body.weights, userId);
    await this.auditLog.record({ actorUserId: userId, action: "settings.match_weights_updated", entityType: "platform_settings", metadata: { weights: body.weights } });
    const { enqueued } = await this.matches.enqueueRecalculationForAllBuyers();
    return { saved: true, recalculationEnqueuedFor: enqueued };
  }

  @Patch("commission-rate")
  async updateCommissionRate(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(updateCommissionRateRequestSchema)) body: ReturnType<typeof updateCommissionRateRequestSchema.parse>,
  ) {
    await this.settings.set("commissionDefaultRate", body.rate, userId);
    await this.auditLog.record({ actorUserId: userId, action: "settings.commission_rate_updated", entityType: "platform_settings", metadata: { rate: body.rate } });
    return { saved: true };
  }

  @Patch("radar-sweep-interval")
  async updateRadarSweepInterval(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(updateRadarSweepIntervalRequestSchema)) body: ReturnType<typeof updateRadarSweepIntervalRequestSchema.parse>,
  ) {
    await this.settings.set("radarSweepIntervalMinutes", body.minutes, userId);
    await this.auditLog.record({ actorUserId: userId, action: "settings.radar_sweep_interval_updated", entityType: "platform_settings", metadata: { minutes: body.minutes } });
    return { saved: true };
  }

  @Patch("demand-match-threshold")
  async updateDemandMatchThreshold(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(updateDemandMatchThresholdRequestSchema)) body: ReturnType<typeof updateDemandMatchThresholdRequestSchema.parse>,
  ) {
    await this.settings.set("demandMatchThreshold", body.threshold, userId);
    await this.auditLog.record({ actorUserId: userId, action: "settings.demand_match_threshold_updated", entityType: "platform_settings", metadata: { threshold: body.threshold } });
    return { saved: true };
  }

  @Patch("data-retention-days")
  async updateDataRetentionDays(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(updateDataRetentionDaysRequestSchema)) body: ReturnType<typeof updateDataRetentionDaysRequestSchema.parse>,
  ) {
    await this.settings.set("dataRetentionDays", body.days, userId);
    await this.auditLog.record({ actorUserId: userId, action: "settings.data_retention_days_updated", entityType: "platform_settings", metadata: { days: body.days } });
    return { saved: true };
  }
}
