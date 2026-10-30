import { Injectable, type OnModuleDestroy } from "@nestjs/common";
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
  private readonly connection: IORedis;
  private readonly recalcBuyerQueue: Queue;
  private readonly recalcPropertyQueue: Queue;

  constructor(config: ConfigService<Env, true>) {
    this.connection = new IORedis(config.get("REDIS_URL", { infer: true }), { maxRetriesPerRequest: null });
    this.recalcBuyerQueue = new Queue(QUEUE_RECALC_BUYER, { connection: this.connection });
    this.recalcPropertyQueue = new Queue(QUEUE_RECALC_PROPERTY, { connection: this.connection });
  }

  async enqueueRecalcForBuyer(userId: string): Promise<void> {
    await this.recalcBuyerQueue.add("recalc-buyer", { userId }, JOB_OPTIONS);
  }

  async enqueueRecalcForProperty(propertyId: string): Promise<void> {
    await this.recalcPropertyQueue.add("recalc-property", { propertyId }, JOB_OPTIONS);
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all([this.recalcBuyerQueue.close(), this.recalcPropertyQueue.close()]);
    await this.connection.quit();
  }
}
