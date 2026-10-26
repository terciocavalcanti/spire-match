import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { LeadsModule } from "../leads/leads.module";

import { ContactsController } from "./contacts.controller";
import { ContactsService } from "./contacts.service";

@Module({
  imports: [AuthModule, LeadsModule],
  controllers: [ContactsController],
  providers: [ContactsService],
})
export class ContactsModule {}
