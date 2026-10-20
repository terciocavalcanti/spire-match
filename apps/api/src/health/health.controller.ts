import { Controller, Get, Inject, ServiceUnavailableException } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { sql } from "drizzle-orm";

import type { Database } from "../database/client";
import { DATABASE } from "../database/database.module";

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  @Get("live")
  live() {
    return { status: "ok" as const };
  }

  @Get("ready")
  async ready() {
    try {
      await this.db.execute(sql`select 1`);
      return { status: "ok" as const };
    } catch {
      throw new ServiceUnavailableException({
        code: "DATABASE_UNAVAILABLE",
        message: "Banco de dados indisponível",
      });
    }
  }
}
