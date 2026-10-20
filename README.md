# SPIRE MATCH

> "O imóvel certo, no lugar certo, na hora certa."

Plataforma de inteligência comercial imobiliária: PWA para compradores e
proprietários, painel comercial para corretores/gestores, API própria,
motor de compatibilidade (Match Engine) e CRM — preparada para operação real
na Hostinger VPS KVM 2 e para um futuro app React Native.

**Status atual:** Marco A (Fundação e fidelidade visual) em andamento. Ver o
plano completo e os marcos A–F em `docs/product/` e no histórico de
aprovação da conversa que originou este repositório.

## Estrutura do monorepo

```text
apps/
  web/      PWA comprador/proprietário — Next.js (porta 3000)
  admin/    Painel comercial SPIRE — Next.js (porta 3001)
  api/      API REST /api/v1 — NestJS (porta 4000)
  worker/   Jobs BullMQ (Marco B+)
packages/
  contracts/      Schemas Zod + DTOs — fonte única de verdade dos tipos
  api-client/     SDK TypeScript isomórfico (web, admin, futuro RN)
  domain/         Match Engine e regras de negócio puras/testáveis
  design-tokens/  Cores, tipografia, espaçamento extraídos das 24 telas
  ui-web/         Componentes React compartilhados (web + admin)
  configs/        eslint, tsconfig, prettier compartilhados
infrastructure/
  docker/   docker-compose de desenvolvimento e produção
  caddy/    Reverse proxy / HTTPS automático
docs/       Produto, arquitetura, API, banco, segurança, QA, deploy
design/referencias/   Imagens originais de referência — não alterar
```

## Pré-requisitos locais

- Node.js 22 LTS ou superior (ver `.node-version`)
- pnpm 9 (via Corepack: `corepack enable && corepack prepare pnpm@9.15.4 --activate`)
- Docker Desktop com backend WSL2 (Windows) — para Postgres+PostGIS, Redis, Mailhog

## Subindo o ambiente local

```bash
# 1. Variáveis de ambiente (copiar cada .env.example para .env)
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cp apps/admin/.env.example apps/admin/.env

# 2. Infraestrutura (Postgres+PostGIS, Redis, Mailhog)
# --env-file é necessário: o Compose não lê .env da raiz automaticamente
# quando o arquivo docker-compose está em outra pasta.
docker compose --env-file .env -f infrastructure/docker/docker-compose.dev.yml up -d

# MinIO (storage S3-compatible) está em perfil opcional — só necessário a
# partir do Marco B (upload de mídia). O Docker Hub/quay.io bloqueiam pull
# anônimo da tag "latest" do MinIO; resolver login/imagem antes de ativar:
#   docker compose --env-file .env -f infrastructure/docker/docker-compose.dev.yml --profile storage up -d

# 3. Dependências do monorepo
pnpm install

# 4. Migrations + extensão PostGIS
pnpm db:migrate

# 5. (Opcional) contas de demonstração — uso exclusivo de homologação
pnpm db:seed

# 6. Subir tudo em modo desenvolvimento
pnpm dev
```

- Web (PWA comprador): http://localhost:3000
- Admin (painel comercial): http://localhost:3001
- API: http://localhost:4000/api/v1 — docs Swagger em http://localhost:4000/api/docs
- MinIO console: http://localhost:9001 (perfil `storage`, opcional)
- Mailhog (e-mails de teste): http://localhost:8026

Contas de demonstração (após `pnpm db:seed`, senha `SpireDemo#2026`):

| Papel | E-mail |
|---|---|
| Comprador | `demo.comprador@spirematch.com.br` |
| Admin | `demo.admin@spirematch.com.br` |

**Nunca rodar `db:seed` em produção** — o script se recusa a executar quando `NODE_ENV=production`.

## Integrações externas pendentes

Nenhuma credencial de terceiros é necessária para rodar localmente. Em
produção, as seguintes integrações precisam ser configuradas antes de serem
consideradas ativas (ver `apps/api/.env.example`):

- Provedor de mapas licenciado (MapTiler ou equivalente)
- Storage S3-compatible de produção (Cloudflare R2/Backblaze B2)
- SMTP/provedor de e-mail transacional
- WhatsApp Business Cloud API (Meta)
- Provedor de LLM para o AI Concierge (fallback determinístico sempre disponível sem ele)

## Comandos úteis

```bash
pnpm lint        # eslint em todo o monorepo
pnpm typecheck   # tsc --noEmit em todo o monorepo
pnpm test        # testes unitários (domain) e e2e da API
pnpm build       # build de produção de todos os apps
```

## Documentação

- Arquitetura e ADRs: `docs/architecture/`
- Produto e matriz das 24 telas: `docs/product/`
- API/OpenAPI: `docs/api/`
- Banco de dados: `docs/database/`
- Segurança/LGPD: `docs/security/`
- QA e evidências visuais: `docs/qa/`
- Deploy Hostinger: `docs/deployment/`
