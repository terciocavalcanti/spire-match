import type { Job } from "bullmq";

import type { WorkerEnv } from "../env";
import { callInternalApi } from "../http";
import type { AutomationTickPayload } from "../queues";

export async function processAutomationTick(_job: Job<AutomationTickPayload>, env: WorkerEnv): Promise<void> {
  await callInternalApi(env, "/api/v1/internal/automations/tick");
}
