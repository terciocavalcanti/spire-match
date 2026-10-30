import type { Job } from "bullmq";

import type { WorkerEnv } from "../env";
import { callInternalApi } from "../http";
import type { RadarSweepPayload } from "../queues";

export async function processRadarSweep(_job: Job<RadarSweepPayload>, env: WorkerEnv): Promise<void> {
  await callInternalApi(env, "/api/v1/internal/radars/sweep");
}
