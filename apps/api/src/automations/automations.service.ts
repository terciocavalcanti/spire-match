import { Inject, Injectable } from "@nestjs/common";
import type { AutomationRule, AutomationType, UpdateAutomationRuleRequest } from "@spire/contracts";
import { AUTOMATION_TYPES, leadAutoAssignConfigSchema, slaReminderConfigSchema } from "@spire/contracts";
import { and, eq, gt, inArray, isNull, lt, ne } from "drizzle-orm";

import type { Database } from "../database/client";
import { DATABASE } from "../database/database.module";
import { automationRules, leadActivities, leads, roleAssignments, roles } from "../database/schema";
import { NotificationsService } from "../notifications/notifications.service";

// Mesmo diretório usado por LeadsService.notifyCommercialTeam — corretores
// (`brokers`) não têm conta de login própria, então avisos vão para quem
// tem acesso ao painel (ADMIN/SUPER_ADMIN/SALES_MANAGER).
const COMMERCIAL_TEAM_ROLES = ["ADMIN", "SUPER_ADMIN", "SALES_MANAGER"] as const;
const TERMINAL_STAGES = ["GANHO", "PERDIDO"] as const;
const MAX_LEADS_PER_RUN = 50;

function toRule(row: typeof automationRules.$inferSelect | undefined, type: AutomationType): AutomationRule {
  if (!row) {
    return { type, enabled: false, config: {}, lastRunAt: null, lastRunCount: null, updatedAt: new Date().toISOString() };
  }
  return {
    type: row.type,
    enabled: row.enabled,
    config: row.config as Record<string, unknown>,
    lastRunAt: row.lastRunAt?.toISOString() ?? null,
    lastRunCount: row.lastRunCount,
    updatedAt: row.updatedAt.toISOString(),
  };
}

@Injectable()
export class AutomationsService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly notifications: NotificationsService,
  ) {}

  async list(): Promise<AutomationRule[]> {
    const rows = await this.db.select().from(automationRules);
    const byType = new Map(rows.map((r) => [r.type, r]));
    return AUTOMATION_TYPES.map((type) => toRule(byType.get(type), type));
  }

  async update(type: AutomationType, request: UpdateAutomationRuleRequest, updatedByUserId: string): Promise<AutomationRule> {
    const [row] = await this.db
      .insert(automationRules)
      .values({ type, enabled: request.enabled, config: request.config, updatedByUserId })
      .onConflictDoUpdate({
        target: automationRules.type,
        set: { enabled: request.enabled, config: request.config, updatedAt: new Date(), updatedByUserId },
      })
      .returning();
    return toRule(row, type);
  }

  private async notifyCommercialTeam(title: string, body: string, linkUrl: string): Promise<void> {
    const recipients = await this.db
      .selectDistinct({ userId: roleAssignments.userId })
      .from(roleAssignments)
      .innerJoin(roles, eq(roles.id, roleAssignments.roleId))
      .where(inArray(roles.name, COMMERCIAL_TEAM_ROLES));

    await Promise.all(recipients.map((r) => this.notifications.notify(r.userId, "LEAD_SIGNAL", title, body, linkUrl)));
  }

  /** Round-robin determinístico entre os corretores configurados — cursor persistido para ser justo entre execuções. */
  async runLeadAutoAssign(): Promise<number> {
    const [rule] = await this.db.select().from(automationRules).where(eq(automationRules.type, "LEAD_AUTO_ASSIGN")).limit(1);
    if (!rule?.enabled) return 0;

    const config = leadAutoAssignConfigSchema.safeParse(rule.config);
    if (!config.success || config.data.brokerIds.length === 0) return 0;
    const { brokerIds } = config.data;

    const unassigned = await this.db
      .select({ id: leads.id })
      .from(leads)
      .where(and(isNull(leads.assignedBrokerId), ne(leads.stage, "GANHO"), ne(leads.stage, "PERDIDO")))
      .orderBy(leads.createdAt)
      .limit(MAX_LEADS_PER_RUN);

    let cursor = rule.roundRobinCursor;
    for (const lead of unassigned) {
      const brokerId = brokerIds[cursor % brokerIds.length]!;
      cursor += 1;
      await this.db.update(leads).set({ assignedBrokerId: brokerId, updatedAt: new Date() }).where(eq(leads.id, lead.id));
      await this.db.insert(leadActivities).values({
        leadId: lead.id,
        type: "ASSIGNED",
        description: "Atribuído automaticamente pela regra de distribuição (round-robin).",
      });
    }

    await this.db
      .update(automationRules)
      .set({ roundRobinCursor: cursor, lastRunAt: new Date(), lastRunCount: unassigned.length })
      .where(eq(automationRules.type, "LEAD_AUTO_ASSIGN"));

    return unassigned.length;
  }

  /** Nunca reavisa o mesmo lead parado mais de uma vez por janela de SLA — ver marcador SLA_REMINDER_SENT. */
  async runSlaReminders(): Promise<number> {
    const [rule] = await this.db.select().from(automationRules).where(eq(automationRules.type, "SLA_REMINDER")).limit(1);
    if (!rule?.enabled) return 0;

    const config = slaReminderConfigSchema.safeParse(rule.config);
    const hoursThreshold = config.success ? config.data.hoursThreshold : 24;
    const threshold = new Date(Date.now() - hoursThreshold * 60 * 60 * 1000);

    const staleLeads = await this.db
      .select({ id: leads.id, userId: leads.userId, stage: leads.stage })
      .from(leads)
      .where(and(lt(leads.updatedAt, threshold), ne(leads.stage, "GANHO"), ne(leads.stage, "PERDIDO")))
      .limit(MAX_LEADS_PER_RUN);

    let notified = 0;
    for (const lead of staleLeads) {
      const [alreadyReminded] = await this.db
        .select({ id: leadActivities.id })
        .from(leadActivities)
        .where(and(eq(leadActivities.leadId, lead.id), eq(leadActivities.type, "SLA_REMINDER_SENT"), gt(leadActivities.createdAt, threshold)))
        .limit(1);
      if (alreadyReminded) continue;

      await this.db.insert(leadActivities).values({
        leadId: lead.id,
        type: "SLA_REMINDER_SENT",
        description: `Sem atividade há mais de ${hoursThreshold}h — lembrete de SLA enviado ao time comercial.`,
      });
      await this.notifyCommercialTeam(
        "Lead parado — lembrete de SLA",
        `Um lead está sem atividade há mais de ${hoursThreshold}h e precisa de acompanhamento.`,
        `/admin/leads/${lead.id}`,
      );
      notified += 1;
    }

    await this.db
      .update(automationRules)
      .set({ lastRunAt: new Date(), lastRunCount: notified })
      .where(eq(automationRules.type, "SLA_REMINDER"));

    return notified;
  }
}
