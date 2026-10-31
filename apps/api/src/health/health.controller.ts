import { Controller, Get, Inject, ServiceUnavailableException } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { sql } from "drizzle-orm";

import type { Database } from "../database/client";
import { DATABASE } from "../database/database.module";
import { QueueService } from "../queue/queue.service";

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly queue: QueueService,
  ) {}

  @Get("live")
  live() {
    return { status: "ok" as const };
  }

  @Get("ready")
  async ready() {
    let databaseOk = false;
    try {
      await this.db.execute(sql`select 1`);
      databaseOk = true;
    } catch {
      databaseOk = false;
    }
    const redisOk = await this.queue.ping();

    if (!databaseOk || !redisOk) {
      throw new ServiceUnavailableException({
        code: "DEPENDENCY_UNAVAILABLE",
        message: "Dependência indisponível",
        details: { database: databaseOk, redis: redisOk },
      });
    }
    return { status: "ok" as const, database: true, redis: true };
  }
}
