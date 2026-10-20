import { Module } from "@nestjs/common";

import { PropertiesModule } from "../properties/properties.module";

import { AiSearchController } from "./ai-search.controller";
import { AiSearchService } from "./ai-search.service";

@Module({
  imports: [PropertiesModule],
  controllers: [AiSearchController],
  providers: [AiSearchService],
})
export class AiSearchModule {}
