import { Controller, Get, Query, Res, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { reportsQuerySchema, vgvReportQuerySchema } from "@spire/contracts";
import type { Response } from "express";

import { SessionAuthGuard } from "../auth/guards/session-auth.guard";
import { CommissionsService } from "../commissions/commissions.service";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";

import { buildReportPdf } from "./report-pdf";
import { ReportsService } from "./reports.service";

const FINANCE_ROLES = ["ADMIN", "SUPER_ADMIN", "SALES_MANAGER"] as const;

function escapeCsvField(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}
function toCsv(headers: string[], rows: string[][]): string {
  return [headers, ...rows].map((row) => row.map(escapeCsvField).join(",")).join("\n");
}

@ApiTags("reports")
@Controller("reports")
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles(...FINANCE_ROLES)
export class ReportsController {
  constructor(
    private readonly reports: ReportsService,
    private readonly commissions: CommissionsService,
  ) {}

  @Get("vgv")
  async vgv(@Query(new ZodValidationPipe(vgvReportQuerySchema)) query: ReturnType<typeof vgvReportQuerySchema.parse>) {
    return this.reports.vgvReport(query.days, query.groupBy);
  }

  @Get("attribution")
  async attribution(@Query(new ZodValidationPipe(reportsQuerySchema)) query: ReturnType<typeof reportsQuerySchema.parse>) {
    return this.reports.attributionReport(query.days);
  }

  @Get("attribution/export.csv")
  async exportAttributionCsv(
    @Query(new ZodValidationPipe(reportsQuerySchema)) query: ReturnType<typeof reportsQuerySchema.parse>,
    @Res() res: Response,
  ) {
    const report = await this.reports.attributionReport(query.days);
    const headers = ["comprador", "valor_venda", "primeiro_toque", "primeiro_toque_em", "ultimo_toque", "ultimo_toque_em", "canais_influenciadores"];
    const rows = report.rows.map((r) => [
      r.buyerName,
      r.wonAmount.toString(),
      r.firstTouchChannel,
      r.firstTouchAt,
      r.lastTouchChannel,
      r.lastTouchAt,
      r.influencedChannels.join("; "),
    ]);
    const csv = `${String.fromCharCode(0xfeff)}${toCsv(headers, rows)}`;
    res.set({ "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="atribuicao-${query.days}d.csv"` });
    res.send(csv);
  }

  @Get("export.pdf")
  async exportPdf(@Query(new ZodValidationPipe(reportsQuerySchema)) query: ReturnType<typeof reportsQuerySchema.parse>, @Res() res: Response) {
    const [vgv, attribution, commissionsSummary] = await Promise.all([
      this.reports.vgvReport(query.days, "broker"),
      this.reports.attributionReport(query.days),
      this.commissions.summary(query.days),
    ]);

    const doc = buildReportPdf({
      days: query.days,
      vgv: vgv.vgv,
      wonCount: vgv.wonCount,
      commissionsPrevisto: commissionsSummary.previstoTotal,
      commissionsRecebido: commissionsSummary.recebidoTotal,
      vgvBreakdown: vgv.breakdown,
      attributionByFirstTouch: attribution.byFirstTouch,
    });

    res.set({ "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="relatorio-${query.days}d.pdf"` });
    doc.pipe(res);
    doc.end();
  }
}
