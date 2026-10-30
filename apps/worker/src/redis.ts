import IORedis from "ioredis";

// BullMQ exige maxRetriesPerRequest: null na conexão passada a Worker/Queue
// (ver docs do BullMQ) — sem isso, comandos de bloqueio (BRPOPLPUSH etc.)
// podem falhar silenciosamente sob instabilidade de rede.
export function createRedisConnection(url: string): IORedis {
  return new IORedis(url, { maxRetriesPerRequest: null });
}
