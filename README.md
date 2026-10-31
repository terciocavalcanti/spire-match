# VALORI MATCH

Plataforma de inteligência comercial imobiliária: PWA para compradores,
painel comercial para corretores/admin, API e worker assíncrono. Monorepo
pnpm + Turborepo, 100% em pt-BR.

Para o histórico de especificação original (prompt mestre, referências
visuais, matriz de 24 telas) que deu origem a este projeto, ver
`README_COMECE_AQUI.md` e `PROMPT_MESTRE_ANTIGRAVITY.md`. Este README
documenta o produto **já implementado**, do jeito que ele roda hoje.

## Arquitetura (visão rápida)

- `apps/web` — PWA do comprador/proprietário (Next.js).
- `apps/admin` — painel comercial (Next.js).
- `apps/api` — API REST (NestJS + Drizzle/Postgres + BullMQ/Redis).
- `apps/worker` — jobs assíncronos (recálculo de Match, varredura de radares, automações) — mesma base de código da API, processo separado.
- `packages/contracts` — schemas Zod compartilhados (request/response).
- `packages/domain` — regras de negócio puras (Match Engine, score de lead, parsing de busca por IA, roteirização de tour).
- `packages/design-tokens` — paleta de cores e tokens compartilhados entre web/admin (Tailwind).
- `packages/ui-web` — componentes React compartilhados entre web/admin.

Detalhe completo em `docs/architecture/ARCHITECTURE.md`.

## Pré-requisitos

- Node.js ≥ 22
- pnpm 9 (`corepack enable` já resolve a versão fixada em `package.json`)
- Docker (para Postgres/Redis/Mailhog locais)

## Rodando do zero (máquina nova)

```bash
pnpm install

# sobe Postgres (porta 5433), Redis (6379) e Mailhog (SMTP de teste) locais
docker compose -f infrastructure/docker/docker-compose.dev.yml up -d

# copie os .env.example — os defaults já funcionam sem editar nada
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cp apps/admin/.env.example apps/admin/.env
cp apps/worker/.env.example apps/worker/.env

# INTERNAL_API_KEY vem em branco no .env.example (protege as rotas /internal/*
# entre api e worker) e a validação de ambiente exige pelo menos 16
# caracteres — a API não sobe sem isso. Gere um valor e cole em
# apps/api/.env E apps/worker/.env (precisa ser o mesmo valor nos dois):
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"

pnpm db:migrate
pnpm db:seed      # cria usuários demo e dados ilustrativos (nunca dados reais)

pnpm dev          # web:3000  admin:3001  api:4000 (+worker)
```

Credenciais demo criadas pelo seed (ver `apps/api/src/database/seed.ts`):

| Papel | E-mail | Senha |
|---|---|---|
| Comprador | `demo.comprador@spirematch.com.br` | `SpireDemo#2026` |
| Admin | `demo.admin@spirematch.com.br` | `SpireDemo#2026` |

## Comandos do dia a dia

```bash
pnpm dev                          # todos os apps em modo watch
pnpm turbo run typecheck lint test build   # gate completo (obrigatório antes de commit)
pnpm test:e2e                     # suíte Playwright — requer `pnpm dev` rodando (ver docs/qa/TEST_PLAN.md)
node scripts/load-test.mjs        # teste de carga local honesto (ver docs/qa/TEST_RESULTS.md)
node scripts/export-openapi.mjs   # regenera apps/api/openapi.json a partir da API rodando
pnpm db:generate                  # gera migração Drizzle a partir do schema
```

## O que precisa de credencial real antes de produção

Em desenvolvimento, estas integrações ficam deliberadamente desativadas
(variável em branco no `.env`) — nenhuma é simulada como ativa:

| Variável | Para quê | Fallback em dev |
|---|---|---|
| `MAPTILER_API_KEY` | mapas/geocodificação | desativado |
| `S3_*` | upload de mídia (fotos de imóvel) | MinIO local opcional (`docker compose --profile storage up`) |
| `SMTP_URL` | e-mail transacional | Mailhog local (porta 8026, UI em `http://localhost:8026`) |
| `WHATSAPP_CLOUD_API_TOKEN` / `WHATSAPP_PHONE_NUMBER_ID` | notificação via WhatsApp | não implementado — ver `docs/operations/WHATSAPP_TEMPLATES.md` |
| `LLM_PROVIDER_API_KEY` | busca em linguagem natural | desativado |
| `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY` | push web (W3C Push API) | par de dev já incluso, gere o seu em produção |

Detalhe completo por variável em `docs/operations/PROVIDER_CONFIGURATION.md`.

## Deploy

Duas rotas documentadas e reais, não aspiracionais:

- `docs/deployment/DEPLOY_COOLIFY.md` — via Coolify na Hostinger VPS (rota recomendada).
- `docs/deployment/DEPLOY_HOSTINGER.md` — docker compose manual na mesma VPS.

Antes de ir ao ar: `docs/deployment/PRODUCTION_LAUNCH_CHECKLIST.md`.
Operação contínua: `docs/deployment/BACKUP_RESTORE.md` e
`docs/deployment/ROLLBACK.md`.

## Documentação completa

| Área | Onde |
|---|---|
| Produto | `docs/product/` (PRD, jornadas, regras de negócio, matriz de telas) |
| Arquitetura | `docs/architecture/` (visão geral + ADRs) |
| UI | `docs/ui/` (design system, fidelidade visual) |
| Banco de dados | `docs/database/` (ERD, migrações, índices) |
| API | `docs/api/OPENAPI.md` + `apps/api/openapi.json` (Swagger UI em `/api/docs` com a API rodando) |
| Segurança/LGPD | `docs/security/` (mapa de dados, RBAC, modelo de ameaças) |
| QA | `docs/qa/` (plano de testes, últimos resultados reais, lacunas) |
| Operações | `docs/operations/` (notificações, WhatsApp, provedores) |
| Deploy | `docs/deployment/` |

**Leitura obrigatória antes de prometer qualquer prazo de lançamento:**
`docs/qa/GAPS_REPORT.md` — lista honesta do que ainda não está pronto.
