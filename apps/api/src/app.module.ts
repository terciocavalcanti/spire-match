import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";

import { AdminUsersModule } from "./admin-users/admin-users.module";
import { AiSearchModule } from "./ai-search/ai-search.module";
import { AuthModule } from "./auth/auth.module";
import { AutomationsModule } from "./automations/automations.module";
import { BrokersModule } from "./brokers/brokers.module";
import { BuyerProfileModule } from "./buyer-profile/buyer-profile.module";
import { CommissionsModule } from "./commissions/commissions.module";
import { validateEnv } from "./config/env";
import { ContactsModule } from "./contacts/contacts.module";
import { DatabaseModule } from "./database/database.module";
import { DevelopmentsModule } from "./developments/developments.module";
import { FavoritesModule } from "./favorites/favorites.module";
import { HealthModule } from "./health/health.module";
import { IntegrationsStatusModule } from "./integrations-status/integrations-status.module";
import { InteractionsModule } from "./interactions/interactions.module";
import { InternalModule } from "./internal/internal.module";
import { LeadsModule } from "./leads/leads.module";
import { MatchesModule } from "./matches/matches.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { OwnerLeadsModule } from "./owner-leads/owner-leads.module";
import { PropertiesModule } from "./properties/properties.module";
import { ProposalsModule } from "./proposals/proposals.module";
import { QueueModule } from "./queue/queue.module";
import { RadarsModule } from "./radars/radars.module";
import { ReportsModule } from "./reports/reports.module";
import { SettingsModule } from "./settings/settings.module";
import { ToursModule } from "./tours/tours.module";
import { UnitsModule } from "./units/units.module";
import { VisitsModule } from "./visits/visits.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 120 }],
    }),
    DatabaseModule,
    QueueModule,
    SettingsModule,
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
    CommissionsModule,
    LeadsModule,
    ReportsModule,
    AutomationsModule,
    InternalModule,
    AdminUsersModule,
    DevelopmentsModule,
    UnitsModule,
    IntegrationsStatusModule,
    OwnerLeadsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
