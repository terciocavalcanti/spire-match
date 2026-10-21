# syntax=docker/dockerfile:1
# Build de produção do painel comercial (Next.js). Executar a partir da raiz
# do monorepo:
#   docker build -f infrastructure/docker/admin.Dockerfile \
#     --build-arg NEXT_PUBLIC_API_URL=https://api.seudominio.com.br/api/v1 \
#     -t spire-match-admin .

FROM node:22-bookworm-slim AS base
RUN corepack enable
WORKDIR /app

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN pnpm turbo run build --filter=@spire/admin...

FROM node:22-bookworm-slim AS runner
ENV NODE_ENV=production
ENV PORT=3001
WORKDIR /app
RUN groupadd --system nextjs && useradd --system --gid nextjs --home /app nextjs

COPY --from=build --chown=nextjs:nextjs /app/apps/admin/public ./apps/admin/public
COPY --from=build --chown=nextjs:nextjs /app/apps/admin/.next/standalone ./
COPY --from=build --chown=nextjs:nextjs /app/apps/admin/.next/static ./apps/admin/.next/static

USER nextjs
EXPOSE 3001
CMD ["node", "apps/admin/server.js"]
