import type { Job } from "bullmq";

import type { WorkerEnv } from "../env";
import { callInternalApi } from "../http";
import type { RecalcPropertyPayload } from "../queues";

export async function processRecalcProperty(job: Job<RecalcPropertyPayload>, env: WorkerEnv): Promise<void> {
  const { propertyId } = job.data;
  await callInternalApi(env, `/api/v1/internal/matches/recalculate-property/${propertyId}`);
}
