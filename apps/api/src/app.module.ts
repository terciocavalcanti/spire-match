import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";

import { AiSearchModule } from "./ai-search/ai-search.module";
import { AuthModule } from "./auth/auth.module";
import { BuyerProfileModule } from "./buyer-profile/buyer-profile.module";
import { validateEnv } from "./config/env";
import { DatabaseModule } from "./database/database.module";
import { FavoritesModule } from "./favorites/favorites.module";
import { HealthModule } from "./health/health.module";
import { InteractionsModule } from "./interactions/interactions.module";
import { MatchesModule } from "./matches/matches.module";
import { PropertiesModule } from "./properties/properties.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 120 }],
    }),
    DatabaseModule,
    HealthModule,
    AuthModule,
    BuyerProfileModule,
    PropertiesModule,
    MatchesModule,
    FavoritesModule,
    InteractionsModule,
    AiSearchModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
