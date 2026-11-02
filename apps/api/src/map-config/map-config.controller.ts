import { Controller, Get } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiTags } from "@nestjs/swagger";

import type { Env } from "../config/env";

/**
 * Serve a chave do Geoapify em tempo de execução (não em build-time via
 * NEXT_PUBLIC_*) porque o Coolify não propaga de forma confiável variáveis
 * usadas só em "build.args" do docker-compose (coollabsio/coolify#5612) —
 * mesmo padrão já usado por GET /notifications/vapid-public-key.
 */
@ApiTags("map-config")
@Controller("map-config")
export class MapConfigController {
  constructor(private readonly config: ConfigService<Env, true>) {}

  @Get()
  get() {
    return { geoapifyApiKey: this.config.get("NEXT_PUBLIC_GEOAPIFY_API_KEY", { infer: true }) ?? null };
  }
}
