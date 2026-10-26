import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";

import { AiSearchModule } from "./ai-search/ai-search.module";
import { AuthModule } from "./auth/auth.module";
import { BrokersModule } from "./brokers/brokers.module";
import { BuyerProfileModule } from "./buyer-profile/buyer-profile.module";
import { validateEnv } from "./config/env";
import { ContactsModule } from "./contacts/contacts.module";
import { DatabaseModule } from "./database/database.module";
import { FavoritesModule } from "./favorites/favorites.module";
import { HealthModule } from "./health/health.module";
import { InteractionsModule } from "./interactions/interactions.module";
import { LeadsModule } from "./leads/leads.module";
import { MatchesModule } from "./matches/matches.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { PropertiesModule } from "./properties/properties.module";
import { ProposalsModule } from "./proposals/proposals.module";
import { RadarsModule } from "./radars/radars.module";
import { ToursModule } from "./tours/tours.module";
import { VisitsModule } from "./visits/visits.module";

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
    BrokersModule,
    NotificationsModule,
    VisitsModule,
    ProposalsModule,
    ContactsModule,
    RadarsModule,
    ToursModule,
    LeadsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
