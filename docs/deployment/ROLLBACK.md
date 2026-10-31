# Rollback — VALORI MATCH

Como reverter um deploy ruim, nos dois cenários reais deste projeto: a
aplicação (imagens Docker) e, quando necessário, o banco.

## Como as imagens são versionadas

`.github/workflows/deploy.yml` builda e publica cada imagem (`api`, `web`,
`admin`, `worker`) no GHCR com **duas tags por push em `main`**:

```
ghcr.io/<owner>/spire-match-<app>:latest
ghcr.io/<owner>/spire-match-<app>:<git-sha>
```

O job `deploy` (rota Hostinger manual) sempre faz `pull`/`up -d` usando o que
`API_IMAGE`/`WEB_IMAGE`/`ADMIN_IMAGE`/`WORKER_IMAGE` apontam no `.env` da VPS
— por padrão `:latest` (ver `.env.prod.example`). Isso significa que **a
tag `:<git-sha>` de cada commit anterior continua existindo no GHCR**, mesmo
depois de um deploy mais recente — é o que torna o rollback por imagem
possível sem rebuildar nada.

O job `test` roda `pnpm turbo run typecheck lint test build` **antes** de
`build-and-push` (corrigido no Marco F1) — um commit que não passa o gate
nunca chega a gerar imagem nova, o que já evita a causa mais comum de "bad
deploy".

## 1. Identificar que o deploy está ruim

- `GET https://api.seudominio.com.br/api/v1/health/ready` — deve responder
  `{"status":"ok","database":true,"redis":true}`. Um 503 com
  `code: "DEPENDENCY_UNAVAILABLE"` (ver `apps/api/src/health/health.controller.ts`)
  aponta para Postgres ou Redis, não necessariamente para o código recém-deployado.
- `docker compose --env-file .env -f infrastructure/docker/docker-compose.prod.yml ps`
  — algum serviço reiniciando em loop (`Restarting`) ou `unhealthy`.
- `docker compose ... logs -f api` (ou `worker`/`web`/`admin`) — erro na
  inicialização, geralmente de env var faltando ou falha de migration.
- Erros reais de usuário (telas quebrando, 500 no navegador) mesmo com os
  healthchecks "ok" — os healthchecks só cobrem Postgres/Redis, não cada
  rota da aplicação.

## 2. Reverter a aplicação (rota Hostinger manual)

Edite o `.env` na VPS, trocando a tag de cada imagem para o SHA do commit
bom anterior (veja no GitHub, aba Actions, qual commit passou verde antes
do ruim):

```bash
# /opt/spire-match/.env
API_IMAGE=ghcr.io/terciocavalcanti/spire-match-api:<sha-bom>
WEB_IMAGE=ghcr.io/terciocavalcanti/spire-match-web:<sha-bom>
ADMIN_IMAGE=ghcr.io/terciocavalcanti/spire-match-admin:<sha-bom>
WORKER_IMAGE=ghcr.io/terciocavalcanti/spire-match-worker:<sha-bom>
```

```bash
cd /opt/spire-match
docker compose --env-file .env -f infrastructure/docker/docker-compose.prod.yml pull
docker compose --env-file .env -f infrastructure/docker/docker-compose.prod.yml up -d
```

Depois de confirmar que o SHA bom está estável, decida se vai corrigir
`main` para frente (forward-fix) e deixar `:latest` voltar a apontar para o
código corrigido, ou manter pinado no SHA até resolver.

## 3. Reverter a aplicação (rota Coolify)

Na aba **Deployments** do recurso, o Coolify lista o histórico de deploys —
use a opção de **Redeploy**/**Rollback** sobre um deployment anterior
marcado como bem-sucedido (a UI exata varia por versão do Coolify; o
mecanismo por trás é o mesmo: reconstrói a partir do commit daquele
deployment). Como o Coolify builda a partir do Git (não consome as tags do
GHCR), reverter aqui significa voltar `main` para o commit bom (`git revert`
ou `git reset` + force-push, com os riscos de sempre) e clicar **Redeploy**,
ou usar a opção de rollback da própria UI se disponível na sua versão.

## 4. E o banco?

**As migrations deste projeto são só para frente** — `drizzle-orm`/`drizzle-kit`
não geram nem aplicam "down migrations" aqui (confirmado: não existe esse
mecanismo no repositório). O `api.Dockerfile` roda
`node dist/database/migrate.js && node dist/main.js` no `CMD` — ou seja,
**toda subida do container `api` tenta aplicar migrations pendentes
automaticamente**, inclusive ao fazer rollback para uma imagem mais antiga.

Isso tem uma consequência importante:

- **Se o deploy ruim NÃO incluiu uma migration nova**: reverter a imagem
  (passo 2/3) é suficiente e seguro — a imagem antiga sobe, não encontra
  migration pendente para aplicar, e volta a servir com o schema atual.
- **Se o deploy ruim incluiu uma migration nova já aplicada**: reverter só a
  imagem NÃO desfaz a migration (ela já rodou e ficou registrada na tabela
  de controle do Drizzle). Se o código antigo não é compatível com o schema
  novo, a opção segura é:
  1. Restaurar o banco a partir do backup mais recente anterior ao deploy
     ruim (ver [BACKUP_RESTORE.md](BACKUP_RESTORE.md)), **ou**
  2. Escrever e aplicar manualmente uma migration SQL corretiva que desfaça
     a mudança de schema problemática, e então reverter a imagem.

  Restaurar backup descarta qualquer dado de usuário gravado depois do
  backup — avalie o trade-off (dado perdido vs. tempo de correção manual)
  antes de escolher.

## 5. Depois do rollback

- Confirme `/health/ready` de novo.
- Rode a suíte e2e contra produção não é o padrão deste projeto (ela é
  pensada para a stack local — ver `docs/qa/TEST_PLAN.md`); valide
  manualmente os fluxos críticos (login, busca, Match) pelo navegador.
- Abra uma issue/registre a causa raiz antes de tentar o forward-fix, para
  não repetir o mesmo migration/bug no próximo deploy.
