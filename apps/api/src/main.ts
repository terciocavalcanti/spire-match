import "reflect-metadata";

import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import helmet from "helmet";

import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { OriginGuard } from "./common/guards/origin.guard";
import type { Env } from "./config/env";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<Env, true>);

  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: config.get("CORS_ALLOWED_ORIGINS", { infer: true }),
    credentials: true,
  });

  app.setGlobalPrefix("api/v1");
  // Validação de entrada é feita por rota via ZodValidationPipe (ver
  // common/pipes/zod-validation.pipe.ts) — sem class-validator/class-transformer.
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalGuards(new OriginGuard(config));

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle("VALORI MATCH API")
      .setDescription("API REST da plataforma VALORI MATCH — /api/v1")
      .setVersion("1.0.0")
      .addCookieAuth("spire_session")
      .build(),
  );
  SwaggerModule.setup("api/docs", app, document);

  const port = config.get("PORT", { infer: true });
  await app.listen(port);
   
  console.log(`VALORI MATCH API ouvindo em http://localhost:${port}/api/v1 (docs em /api/docs)`);
}

bootstrap();
