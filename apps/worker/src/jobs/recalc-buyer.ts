import type { Job } from "bullmq";

import type { WorkerEnv } from "../env";
import { callInternalApi } from "../http";
import type { RecalcBuyerPayload } from "../queues";

export async function processRecalcBuyer(job: Job<RecalcBuyerPayload>, env: WorkerEnv): Promise<void> {
  const { userId } = job.data;
  await callInternalApi(env, `/api/v1/internal/matches/recalculate-buyer/${userId}`);
}
