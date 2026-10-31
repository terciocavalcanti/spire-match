# Plano de testes

Estratégia de testes real usada no projeto, não aspiracional — reflete o
que existe hoje no repositório.

## Camadas

### 1. Unitários (`pnpm turbo run test`)

Rodam via `jest` (API) e `vitest`-like `*.test.ts` nativo do Node (domínio),
cacheados pelo Turborepo. Cobertura real hoje é fina e concentrada na lógica
de domínio pura, não em controllers/services da API:

- `packages/domain/src/match/score.test.ts` — regras de pontuação do Match
  Engine.
- `packages/domain/src/crm/lead-score.test.ts` — cálculo de score de lead.
- `packages/domain/src/ai-search/parse-query.test.ts` — parsing de busca em
  linguagem natural.
- `packages/domain/src/tour/route.test.ts` — roteirização de tour de visitas.
- `apps/api/src/common/pipes/zod-validation.pipe.spec.ts` — único teste de
  unidade do lado da API.

**Lacuna conhecida:** nenhum controller/service da API (leads, properties,
owner-leads, audit, LGPD, etc.) tem teste de unidade/integração dedicado.
A cobertura desses caminhos vem apenas da suíte e2e (camada 3) e da
verificação funcional manual feita a cada marco (scripts ad hoc contra a API
real, não persistidos). Ver `docs/qa/GAPS_REPORT.md`.

### 2. Tipos, lint, build (`pnpm turbo run typecheck lint build`)

Gate obrigatório antes de todo commit desde o Marco A. Cobre os 4 apps
(web, admin, api, worker) e os pacotes compartilhados (contracts, domain,
design-tokens, ui-web).

### 3. End-to-end (`pnpm test:e2e`, pacote `tests/e2e/`)

Suíte Playwright persistida, introduzida no Marco F4 (antes disso, cada
marco era verificado com scripts descartáveis e screenshots manuais, nunca
comitados como teste reexecutável). Requer a stack local rodando
(`pnpm dev` + Postgres/Redis) e os usuários demo já seedados.

- `specs/web.spec.ts` — fluxo do comprador: login, Matches reais na Home,
  busca em Explorar, detalhe de imóvel, favoritar/desfavoritar, deck de
  swipe, captação de imóvel, perfil/LGPD.
- `specs/admin.spec.ts` — painel comercial: visão geral e as 9 telas
  principais (leads, proprietários, captações, campanhas, parceiros,
  conteúdo, auditoria, privacidade, configurações) + kanban de captações.
- `specs/accessibility.spec.ts` — varredura automatizada via
  `@axe-core/playwright` em 6 telas-chave (web e admin). Falha apenas em
  violações de impacto `critical`/`serious`; violações `moderate`/`minor`
  são logadas, não travam a suíte.
- `specs/responsive.spec.ts` — matriz mobile/tablet/desktop checando
  ausência de overflow horizontal em telas-chave — aproximação automatizável
  de "PWA cross-device"; teste em hardware físico real continua sendo uma
  lacuna (ver `docs/qa/GAPS_REPORT.md`).

Autenticação usa `globalSetup` + `storageState` por papel (login único por
papel no início da suíte, sessão reaproveitada por todos os testes daquele
papel) — necessário porque `/auth/login` tem throttle de 10 req/60s por IP
(`apps/api/src/auth/auth.controller.ts`), que se esgota rapidamente se cada
teste fizer login individualmente.

**Lacuna conhecida:** a suíte e2e roda apenas localmente, de forma manual —
ainda não está no pipeline de CI (`.github/workflows/deploy.yml`), porque o
runner de CI não sobe a stack completa de containers. Ver `docs/qa/GAPS_REPORT.md`.

### 4. Carga (`node scripts/load-test.mjs`)

Script Node puro (Marco F5), sem dependência nova. Mede p50/p95/p99 e taxa
de erro reais contra 3 endpoints de leitura, com concorrência configurável.
Números são de ambiente de desenvolvimento local — nunca representam
capacidade de produção. Ver `docs/qa/TEST_RESULTS.md` para os números da
última execução.

### 5. Verificação funcional manual (todos os marcos)

Em cada fase (A–F), além dos testes acima, uma verificação funcional real
foi feita contra a API/UI rodando localmente — scripts ad hoc exercitando
o fluxo completo (ex.: "proprietário solicita captação → corretor aprova →
imóvel entra no catálogo → comprador favorita → CRM registra"), e checagem
visual via Playwright com zero erros de console. Esses scripts eram
descartados após o uso (não fazem parte do repositório); a suíte e2e
persistida (camada 3) é a sucessora direta desse processo para fluxos
centrais, mas não cobre 100% do que já foi verificado manualmente marco a
marco.

## Como rodar tudo localmente

```bash
pnpm install
pnpm dev                        # sobe web (3000), admin (3001), api (4000), worker
pnpm turbo run typecheck lint test build
pnpm test:e2e                   # requer a stack acima rodando
node scripts/load-test.mjs --concurrency=20 --requests=100
```
