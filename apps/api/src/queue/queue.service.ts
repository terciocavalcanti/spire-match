import { Injectable, Logger, type OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Queue } from "bullmq";
import IORedis from "ioredis";

import type { Env } from "../config/env";

export const QUEUE_RECALC_BUYER = "match-recalc-buyer";
export const QUEUE_RECALC_PROPERTY = "match-recalc-property";

const JOB_OPTIONS = {
  attempts: 5,
  backoff: { type: "exponential" as const, delay: 5_000 },
  removeOnComplete: { count: 200 },
  removeOnFail: { count: 500 },
};

/**
 * Produtor BullMQ: só enfileira, nunca processa. O processamento real roda
 * em apps/worker, que chama de volta as rotas /internal/* (ver
 * src/internal/internal.controller.ts) — nenhuma lógica de negócio duplicada
 * aqui (seção "Decisão de arquitetura — Marco C" do plano).
 */
@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private readonly connection: IORedis;
  private readonly recalcBuyerQueue: Queue;
  private readonly recalcPropertyQueue: Queue;

  constructor(config: ConfigService<Env, true>) {
    this.connection = new IORedis(config.get("REDIS_URL", { infer: true }), { maxRetriesPerRequest: null });
    // Sem este handler, um erro de conexão (Redis fora do ar, host errado)
    // vira uma exceção não tratada e derruba o processo inteiro da API —
    // só enfileirar fica indisponível, o resto da API continua respondendo.
    this.connection.on("error", (err) => this.logger.error(`Erro na conexão Redis (fila): ${err.message}`));

    this.recalcBuyerQueue = new Queue(QUEUE_RECALC_BUYER, { connection: this.connection });
    this.recalcPropertyQueue = new Queue(QUEUE_RECALC_PROPERTY, { connection: this.connection });
  }

  /**
   * Melhor esforço: a ação principal (criar imóvel, salvar preferências) já
   * foi persistida no banco antes de chamar isto — uma falha aqui (Redis
   * fora do ar) nunca deve virar erro 500 para quem só queria salvar o
   * registro. O recálculo fica pendente até o Redis voltar.
   */
  async enqueueRecalcForBuyer(userId: string): Promise<void> {
    try {
      await this.recalcBuyerQueue.add("recalc-buyer", { userId }, JOB_OPTIONS);
    } catch (err) {
      this.logger.error(`Falha ao enfileirar recálculo para o comprador ${userId}: ${(err as Error).message}`);
    }
  }

  async enqueueRecalcForProperty(propertyId: string): Promise<void> {
    try {
      await this.recalcPropertyQueue.add("recalc-property", { propertyId }, JOB_OPTIONS);
    } catch (err) {
      this.logger.error(`Falha ao enfileirar recálculo para o imóvel ${propertyId}: ${(err as Error).message}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all([this.recalcBuyerQueue.close(), this.recalcPropertyQueue.close()]);
    await this.connection.quit();
  }
}
