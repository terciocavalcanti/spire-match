# syntax=docker/dockerfile:1
# Build de produção do PWA comprador (Next.js + Serwist). Executar a partir
# da raiz do monorepo:
#   docker build -f infrastructure/docker/web.Dockerfile \
#     --build-arg NEXT_PUBLIC_API_URL=https://api.seudominio.com.br/api/v1 \
#     --build-arg NEXT_PUBLIC_MAPTILER_API_KEY=... \
#     -t spire-match-web .
#
# NEXT_PUBLIC_* são embutidos no bundle em tempo de build (padrão Next.js) —
# por isso precisam ser passados como --build-arg, não como env de runtime.

FROM node:22-bookworm-slim AS base
RUN corepack enable
WORKDIR /app

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_MAPTILER_API_KEY
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_MAPTILER_API_KEY=${NEXT_PUBLIC_MAPTILER_API_KEY}

RUN pnpm turbo run build --filter=@spire/web...

FROM node:22-bookworm-slim AS runner
ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /app
RUN groupadd --system nextjs && useradd --system --gid nextjs --home /app nextjs

COPY --from=build --chown=nextjs:nextjs /app/apps/web/public ./apps/web/public
COPY --from=build --chown=nextjs:nextjs /app/apps/web/.next/standalone ./
COPY --from=build --chown=nextjs:nextjs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
