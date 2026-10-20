import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { type Env } from "../config/env";

import { createDatabase } from "./client";

export const DATABASE = Symbol("DATABASE");

@Global()
@Module({
  providers: [
    {
      provide: DATABASE,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) =>
        createDatabase(config.get("DATABASE_URL", { infer: true })),
    },
  ],
  exports: [DATABASE],
})
export class DatabaseModule {}
