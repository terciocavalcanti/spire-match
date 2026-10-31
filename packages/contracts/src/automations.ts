import { z } from "zod";

export const AUTOMATION_TYPES = ["LEAD_AUTO_ASSIGN", "SLA_REMINDER"] as const;
export const automationTypeSchema = z.enum(AUTOMATION_TYPES);
export type AutomationType = z.infer<typeof automationTypeSchema>;

export const leadAutoAssignConfigSchema = z.object({
  brokerIds: z.array(z.string().uuid()).default([]),
});
export type LeadAutoAssignConfig = z.infer<typeof leadAutoAssignConfigSchema>;

export const slaReminderConfigSchema = z.object({
  hoursThreshold: z.number().int().positive().max(720).default(24),
});
export type SlaReminderConfig = z.infer<typeof slaReminderConfigSchema>;

export const automationRuleSchema = z.object({
  type: automationTypeSchema,
  enabled: z.boolean(),
  config: z.record(z.string(), z.unknown()),
  lastRunAt: z.string().datetime().nullable(),
  lastRunCount: z.number().int().nonnegative().nullable(),
  updatedAt: z.string().datetime(),
});
export type AutomationRule = z.infer<typeof automationRuleSchema>;

export const updateAutomationRuleRequestSchema = z.object({
  enabled: z.boolean(),
  config: z.record(z.string(), z.unknown()),
});
export type UpdateAutomationRuleRequest = z.infer<typeof updateAutomationRuleRequestSchema>;

export const runAutomationResultSchema = z.object({
  type: automationTypeSchema,
  affected: z.number().int().nonnegative(),
});
export type RunAutomationResult = z.infer<typeof runAutomationResultSchema>;
