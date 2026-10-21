# syntax=docker/dockerfile:1
# Build de produção da API (NestJS). Executar sempre a partir da raiz do
# monorepo: `docker build -f infrastructure/docker/api.Dockerfile -t spire-match-api .`

FROM node:22-bookworm-slim AS base
RUN corepack enable
WORKDIR /app

FROM base AS build
# python3/make/g++: o pacote "argon2" compila um binding nativo quando não
# encontra um binário pré-compilado para a plataforma exata do build.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY . .
RUN pnpm install --frozen-lockfile
# Builda a API e suas dependências de workspace (@spire/domain, @spire/contracts).
RUN pnpm turbo run build --filter=@spire/api...
# `pnpm deploy` empacota a API + só as dependências de produção já resolvidas
# num diretório autocontido (sem symlinks pnpm) — ideal para a imagem final.
RUN pnpm --filter=@spire/api deploy --prod /app/deploy/api

FROM node:22-bookworm-slim AS runner
ENV NODE_ENV=production
WORKDIR /app
RUN groupadd --system spire && useradd --system --gid spire --home /app spire
COPY --from=build --chown=spire:spire /app/deploy/api ./
USER spire
EXPOSE 4000
# As migrations rodam a cada start do container: seguro porque são idempotentes
# (drizzle-orm só aplica o que ainda não foi aplicado) e a API é um único
# serviço nesta VPS (sem múltiplas réplicas concorrendo pela migration).
CMD ["sh", "-c", "node dist/database/migrate.js && node dist/main.js"]
