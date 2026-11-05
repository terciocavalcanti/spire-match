import type { Job } from "bullmq";

import type { WorkerEnv } from "../env";
import { callInternalApi } from "../http";
import type { IntegrationEventsRetryPayload } from "../queues";

export async function processIntegrationEventsRetry(_job: Job<IntegrationEventsRetryPayload>, env: WorkerEnv): Promise<void> {
  await callInternalApi(env, "/api/v1/internal/integration-events/requeue-failed");
}
