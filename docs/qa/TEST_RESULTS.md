# Resultados de teste — Marco F (última execução)

Números reais da última execução completa da suíte, feita durante a
implementação do Marco F (2026-10-31), contra a stack local (Postgres/Redis
em containers, API/worker/web/admin via `pnpm dev`, Node 22). Não são
números de produção — ver `docs/qa/GAPS_REPORT.md`.

## Gate (`pnpm turbo run typecheck lint test build`)

29/29 tarefas com sucesso (typecheck + lint + test + build dos 4 apps e dos
pacotes compartilhados). Sem cache, forçando execução completa
(`--force`). Tempo total: ~3min.

## Suíte e2e (`pnpm test:e2e`)

**29/29 testes passando.**

| Spec | Testes | Resultado |
|---|---|---|
| `web.spec.ts` | 7 | 7 passando |
| `admin.spec.ts` | 11 | 11 passando |
| `accessibility.spec.ts` | 6 | 6 passando (0 violação crítica/séria) |
| `responsive.spec.ts` | 6 (3 viewports × web/admin) | 6 passando |

A suíte, na primeira execução real, encontrou e expôs problemas genuínos
(não apenas falhas de asserção de teste) que foram corrigidos como parte do
Marco F, não contornados:

- **Contraste de cor insuficiente (WCAG AA)** em `packages/design-tokens/src/colors.ts`:
  `ink.tertiary` e os tokens de status `hot`/`warm`/`info`/`danger` não
  atingiam 4.5:1 contra seus fundos pareados (ratios reais medidos entre
  2.5:1 e 3.7:1). Ajustados para ficar entre 4.6:1 e 5.4:1, mantendo a
  mesma identidade de cor. Como esses tokens alimentam o Tailwind das duas
  apps, a correção afeta dezenas de telas.
- **Três casos de "label-content-name-mismatch"** (WCAG 2.5.3 — texto
  visível não incluso no nome acessível): avatar com iniciais no
  `SpireHeader`, card de imóvel sem foto (`PropertyCard`), e campos de
  orçamento/metragem no formulário de preferências sem rótulo associado.
  Corrigidos incluindo o texto visível no `aria-label` (fora de
  parênteses — o `axe-core` descarta conteúdo parentético ao comparar).
- Um teste (`favoritar um imóvel`) tinha um locator amplo demais que podia
  casar com o botão de favoritar de outro card na mesma página; corrigido
  para escopar ao `<main>` da página de detalhe e para afirmar a navegação
  real antes de interagir.

Violações de acessibilidade `moderate` (meta-viewport, ausência de h1 em
`/explorar`) continuam logadas pela suíte, não bloqueiam — ver
`docs/qa/GAPS_REPORT.md`.

## Teste de carga (`node scripts/load-test.mjs --concurrency=20 --requests=100`)

0% de erro nos três endpoints, dentro do limite do `ThrottlerGuard` global
(120 req/60s por IP+rota — acima disso o próprio guard rejeita com 429,
comportamento correto e confirmado, não um bug).

| Endpoint | Média | p50 | p95 | p99 | Vazão |
|---|---|---|---|---|---|
| `GET /properties` (busca pública) | 64.6ms | 64.6ms | 82.7ms | 87.8ms | ~292 req/s |
| `GET /matches` (Match Engine, comprador) | 163.5ms | 149.3ms | 215.1ms | 225.0ms | ~119 req/s |
| `GET /leads` (listagem CRM, admin) | 74.3ms | 72.7ms | 93.8ms | 98.4ms | ~260 req/s |

`/matches` é o mais lento por desenho, não por bug: calcula o score contra
todos os imóveis disponíveis em tempo real e persiste o resultado em cada
leitura (`apps/api/src/matches/matches.service.ts`). Revisão dos três
serviços não encontrou N+1 — todos usam `select` único com joins/filtros e
`insert` em lote; nenhuma otimização especulativa foi aplicada.

**Estes números são de uma máquina de desenvolvimento local com um único
processo de cada serviço — nunca devem ser lidos como capacidade de
produção.**
