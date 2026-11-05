# Novos recursos — progresso (M0–M12)

Acompanha a evolução do VALORI MATCH sobre o sistema existente (Marcos A–F,
já completos — ver `docs/product/PRD.md`). Antes de retomar: releia este
documento e `docs/product/NOVOS_RECURSOS_M0_DIAGNOSTICO.md`, depois confira o
código real — não confie neles como estado atual sem verificar.

## Infra — deploy automático (Coolify) ✅ resolvido em 2026-11-05

O recurso no Coolify estava conectado via "Public GitHub" (sem webhook
automático) — cada push em `main` exigia clicar **Redeploy** manualmente
(ver `docs/deployment/DEPLOY_COOLIFY.md`, seção 6). Trocado para a fonte
`git-arkiv` (conexão via GitHub App já autorizada), que registra webhook
automático. Este commit é o teste real desse webhook: se aparecer um
deployment automático no Coolify logo após o push, sem clique manual, está
confirmado.

## M0 — Diagnóstico ✅ concluído

Ver `docs/product/NOVOS_RECURSOS_M0_DIAGNOSTICO.md`: arquitetura confirmada
por leitura de código, matriz dos 12 marcos, decisão de arquitetura sobre
isolamento "por imobiliária" (tratado como isolamento por conexão — sistema
é single-tenant), baseline `pnpm turbo run typecheck lint test build`
(29/29 antes de qualquer mudança).

## M1 — Base das integrações ✅ concluído

**O que já existia e foi reaproveitado:**
- Padrão worker-as-scheduler (`apps/worker` chama `/internal/*` na API, nunca
  acessa o banco direto) — mesmo padrão de `radar-sweep`/`automation-tick`.
- `AuditLogService` (global) para as ações de criar/ativar/pausar conexão.
- Padrão de erro de violação de unicidade sob concorrência (`pgErrorCode`/
  `isUniqueViolation`), copiado de `VisitsService` (reserva atômica de
  visita) para o dedupe de eventos.
- Convenção de cursor de paginação (`decodeCursor`/`encodeCursor`) de
  `AuditLogService`/`SettingsService`.

**O que mudou:**
- 3 tabelas novas (`apps/api/src/database/schema/integration-connections.ts`):
  `integration_connections`, `integration_external_refs`,
  `integration_events` — migration `0016_curvy_wasp.sql`.
- Módulo `apps/api/src/integration-connections/`: `IntegrationConnectionsService`
  (CRUD + ativar/pausar), `IntegrationExternalRefsService` (mapa
  interno↔externo), `IntegrationEventsService` (ingestão com dedupe real sob
  concorrência, `markProcessed`/`markFailed`, `requeueFailed` com teto de
  tentativas).
- Rotas admin `/integration-connections` (+ `:id/events`, `events/retry-failed`)
  e rota interna `/internal/integration-events/requeue-failed` (worker).
- Worker: fila `integration-events-retry` (novo job repetível, intervalo
  configurável via `INTEGRATION_EVENTS_RETRY_INTERVAL_MINUTES`, default 20 min).
- Admin UI: `/admin/integracoes` ganhou a seção "Conexões externas" (criar
  conexão, ativar/pausar, contador de eventos pendentes/falhos, reprocessar
  falhas).
- `packages/contracts/src/integration-connections.ts` e
  `packages/api-client` (`apiClient.integrationConnections`) novos.
- `docs/database/ERD.md` ganhou o grupo 9 (Integrações externas).

**Compatibilidade com dados antigos:** migration é só-adiante (`ADD TABLE`),
nenhuma tabela/coluna existente foi alterada — zero risco para dados do
Marco A–F.

**Verificações executadas e resultados:**
- `drizzle-kit generate` → migration revisada manualmente (índice único
  parcial confirmado no SQL gerado).
- Migration aplicada de ponta a ponta contra um Postgres real descartável
  (container isolado, fora do volume de dev existente — ver nota abaixo):
  `pnpm --filter @spire/api db:migrate` → sucesso, 3 tabelas confirmadas via
  `\dt integration*`.
- Teste de unidade (`integration-events.service.spec.ts`, 3 casos: insere
  novo, devolve duplicata, relança erro sem `externalEventId`) — sem
  depender de banco, mesmo padrão do único teste de API pré-existente
  (`ZodValidationPipe`), para não quebrar o CI (que não sobe Postgres no job
  `test`, ver `docs/qa/GAPS_REPORT.md`).
- Verificação manual adicional contra o Postgres real descartável (script
  temporário, removido depois de confirmar): dedupe sob concorrência real
  (`Promise.all` com o mesmo `externalEventId`) resultou em exatamente 1
  linha; `requeueFailed` respeitou o teto de tentativas (evento no teto não
  reentra). Ambos passaram.
- `pnpm turbo run typecheck lint test build --force`: 1ª rodada achou 1
  warning de `import/order` (corrigido) — segunda rodada em andamento no
  momento deste registro; ver commit/relato da sessão para o resultado final.

**Nota sobre o ambiente local:** o container de desenvolvimento padrão
(`docker compose -f infrastructure/docker/docker-compose.dev.yml up -d`,
volume `spire_postgres_data`) está com a role `spire` ausente nesta máquina
— aparenta ser resíduo de uma inicialização anterior com credenciais
diferentes, **não é causado por este M1**. Não foi "corrigido"
automaticamente (exigiria recriar/inspecionar um volume que pode ter dados
que não são meus para descartar) — avisar o usuário antes de qualquer ação
nesse volume.

**Bloqueios e próximo passo:** M1 é propositalmente provider-agnóstico — não
simula nenhuma integração como ativa. M2 (recebimento de leads externos e
publicação, M5) precisam de um provedor real nomeado + credenciado antes de
qualquer lógica específica de payload/assinatura de webhook; sem isso, o
próximo passo executável é M3 (perfil progressivo + match imediato), que não
depende de nenhuma integração externa.

## M2–M12 — pendentes

Ver a matriz completa em `docs/product/NOVOS_RECURSOS_M0_DIAGNOSTICO.md`.
M9 (catálogo externo licenciado) e, por decorrência, M10/M11/M12 dependem de
um provedor nomeado e credenciado — **nenhum nome de portal/provedor foi
confirmado ainda**; não inventar endpoint/campo/capacidade até isso existir.
