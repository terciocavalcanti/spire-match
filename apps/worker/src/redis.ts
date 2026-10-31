import IORedis from "ioredis";

// BullMQ exige maxRetriesPerRequest: null na conexão passada a Worker/Queue
// (ver docs do BullMQ) — sem isso, comandos de bloqueio (BRPOPLPUSH etc.)
// podem falhar silenciosamente sob instabilidade de rede.
export function createRedisConnection(url: string): IORedis {
  const connection = new IORedis(url, { maxRetriesPerRequest: null });
  // BullMQ trata reconexão internamente, mas sem nenhum listener de 'error'
  // na conexão crua o Node derruba o processo inteiro na primeira falha de
  // rede — o worker deve sobreviver a quedas temporárias do Redis e voltar
  // a processar jobs quando ele reconectar, não reiniciar em loop.
  connection.on("error", (err) => console.error("Erro na conexão Redis:", err.message));
  return connection;
}
