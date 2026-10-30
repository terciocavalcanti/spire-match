# syntax=docker/dockerfile:1
# Build de produção do worker (BullMQ). Executar sempre a partir da raiz do
# monorepo: `docker build -f infrastructure/docker/worker.Dockerfile -t spire-match-worker .`

FROM node:22-bookworm-slim AS base
RUN corepack enable
WORKDIR /app

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm turbo run build --filter=@spire/worker...
RUN pnpm --filter=@spire/worker deploy --prod /app/deploy/worker

FROM node:22-bookworm-slim AS runner
ENV NODE_ENV=production
WORKDIR /app
RUN groupadd --system spire && useradd --system --gid spire --home /app spire
COPY --from=build --chown=spire:spire /app/deploy/worker ./
USER spire
CMD ["node", "dist/index.js"]
