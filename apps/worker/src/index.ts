import { Queue, Worker } from "bullmq";

import { loadEnv } from "./env";
import { processRadarSweep } from "./jobs/radar-sweep";
import { processRecalcBuyer } from "./jobs/recalc-buyer";
import { processRecalcProperty } from "./jobs/recalc-property";
import { QUEUE_RADAR_SWEEP, QUEUE_RECALC_BUYER, QUEUE_RECALC_PROPERTY } from "./queues";
import { createRedisConnection } from "./redis";

const env = loadEnv();
const connection = createRedisConnection(env.REDIS_URL);

const DEFAULT_JOB_OPTIONS = {
  attempts: 5,
  backoff: { type: "exponential" as const, delay: 5_000 },
  removeOnComplete: { count: 200 },
  removeOnFail: { count: 500 },
};

async function main(): Promise<void> {
  const recalcBuyerWorker = new Worker(QUEUE_RECALC_BUYER, (job) => processRecalcBuyer(job, env), { connection });
  const recalcPropertyWorker = new Worker(QUEUE_RECALC_PROPERTY, (job) => processRecalcProperty(job, env), {
    connection,
  });
  const radarSweepWorker = new Worker(QUEUE_RADAR_SWEEP, (job) => processRadarSweep(job, env), { connection });

  for (const worker of [recalcBuyerWorker, recalcPropertyWorker, radarSweepWorker]) {
    worker.on("completed", (job) => console.log(`[${worker.name}] job ${job.id} concluído`));
    worker.on("failed", (job, err) => console.error(`[${worker.name}] job ${job?.id} falhou:`, err.message));
  }

  // O sweep de radares é o único job repetível — agendado aqui no boot do
  // worker. BullMQ deduplica por chave de repetição, então reiniciar o worker
  // não cria agendamentos duplicados.
  const radarSweepQueue = new Queue(QUEUE_RADAR_SWEEP, { connection });
  await radarSweepQueue.add(
    "sweep",
    {},
    {
      ...DEFAULT_JOB_OPTIONS,
      repeat: { every: env.RADAR_SWEEP_INTERVAL_MINUTES * 60_000 },
      jobId: "radar-sweep-repeatable",
    },
  );

  console.log(
    `VALORI MATCH worker no ar — fila de recálculo de match ativa, varredura de radares a cada ${env.RADAR_SWEEP_INTERVAL_MINUTES} min.`,
  );

  async function shutdown(): Promise<void> {
    console.log("Encerrando worker...");
    await Promise.all([recalcBuyerWorker.close(), recalcPropertyWorker.close(), radarSweepWorker.close()]);
    await radarSweepQueue.close();
    await connection.quit();
    process.exit(0);
  }

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((error) => {
  console.error("Falha ao iniciar o worker:", error);
  process.exit(1);
});
