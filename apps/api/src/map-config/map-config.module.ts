import { Module } from "@nestjs/common";

import { MapConfigController } from "./map-config.controller";

@Module({
  controllers: [MapConfigController],
})
export class MapConfigModule {}
