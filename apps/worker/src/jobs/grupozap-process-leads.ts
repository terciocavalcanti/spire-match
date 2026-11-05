import type { Job } from "bullmq";

import type { WorkerEnv } from "../env";
import { callInternalApi } from "../http";
import type { GrupoZapProcessLeadsPayload } from "../queues";

export async function processGrupoZapLeads(_job: Job<GrupoZapProcessLeadsPayload>, env: WorkerEnv): Promise<void> {
  await callInternalApi(env, "/api/v1/internal/grupozap/process-pending-leads");
}
