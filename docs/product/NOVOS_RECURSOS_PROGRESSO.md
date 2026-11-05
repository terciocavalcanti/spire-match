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

## M2 — Leads externos (ZAP Imóveis / Viva Real / OLX) ✅ conector implementado, 🔶 aguardando credencial real

Provedor confirmado em 2026-11-05: o usuário pediu para conectar com ZAP
Imóveis e Viva Real. Pesquisa na documentação oficial (`developers.grupozap.com`,
único portal de desenvolvedor encontrado — **não existe** cadastro
self-service equivalente ao `developer.olxgroup.com` europeu para o Brasil;
OLX Brasil/ZAP Imóveis/Viva Real compartilham o mesmo backend de leads,
chamado "Grupo ZAP", e publicação multi-portal é comercializada via **Canal
Pro**, sob consulta comercial) confirmou:

- **Leads** (M2, implementado): webhook `POST` com JSON assinado por Basic
  Auth (`SECRET_KEY` única por CRM) — spec completa em
  `/webhooks/integration_leads.html` e `/webhooks/security.html`.
- **Publicação** (M5, não implementado ainda): feed XML no formato
  **Vrsync** (o formato "Zap" é depreciado) — a Grupo ZAP faz *polling* do
  nosso XML a cada ~12h (`VivaRealBot/1.0`), não um push nosso. Spec em
  `/feeds/vrsync/elements/`, `/feeds/connection_guideline.html`.

**O que foi implementado (M2):**
- `apps/api/src/integration-connections/connectors/grupozap/`: conector
  completo — `grupozap-webhook-auth.guard.ts` (Basic Auth contra
  `GRUPOZAP_WEBHOOK_SECRET_KEY`, 503 se não configurada), `grupozap-lead-payload.schema.ts`
  (schema Zod fiel ao payload documentado), `grupozap-leads.service.ts`
  (ingestão via `IntegrationEventsService` do M1, dedupe por `originLeadId`,
  resolução/criação de usuário por e-mail — nunca duplica identidade —,
  chamada a `LeadsService.recordSignal` reaproveitando 100% do CRM
  existente), `grupozap-leads.controller.ts` (`POST /webhooks/grupozap/leads`).
- Novo tipo de atividade `INTEGRATION_LEAD_RECEIVED` em `LEAD_ACTIVITY_TYPES`
  — avança o estágio para INTERESSE (mesmo peso de um `CONTACT` direto) e
  notifica o time comercial, exatamente como qualquer outro sinal real.
- Worker: fila `grupozap-process-leads` (a cada 5 min, reprocessa eventos
  PENDENTE — cobre o caso de a conexão ter sido ativada depois do
  recebimento, ou falha transitória).
- D6 (`/admin/integracoes`) ganhou a entrada "Grupo ZAP/OLX (leads)".
- Migration `0017_rare_jazinda.sql`: `ALTER TYPE lead_activity_type ADD VALUE`.

**Decisão de identidade:** um lead sem conta prévia na VALORI MATCH gera um
usuário "sombra" (e-mail real do lead, hash de senha aleatório e descartado
— nunca utilizável para login) só para satisfazer `leads.user_id`. Se a
mesma pessoa já tiver conta (mesmo e-mail), reaproveita — nunca duplica.
Gap conhecido, não resolvido nesta fatia: não há fluxo de "reivindicar" essa
conta sombra caso a pessoa se cadastre depois com o mesmo e-mail (colidiria
no `UNIQUE` de `users.email` — precisa de tratamento dedicado se/quando
despriorizar).

**Verificações executadas:**
- `pnpm turbo run typecheck lint test build --force`: achou e corrigiu 2
  mapas exaustivos de `LeadActivityType` no admin (`lead-labels.ts`,
  `leads/[id]/page.tsx`) que não cobriam o novo valor do enum — TypeScript
  pegou isso antes de qualquer teste manual.
- Verificação funcional contra Postgres real descartável (script temporário,
  removido depois): lead novo cria usuário+lead reais e avança para
  INTERESSE; webhook duplicado (mesmo `originLeadId`) não reprocessa nem
  duplica usuário; segundo lead real do mesmo e-mail reaproveita o mesmo
  usuário/lead (2 atividades, 1 lead, 1 usuário) — **essa rodada encontrou um
  bug real**: a migration do novo valor de enum (`ALTER TYPE ... ADD VALUE`)
  não tinha sido gerada, e só apareceu rodando contra Postgres de verdade
  (um mock não capturaria isso) — corrigido com a migration 0017 antes de
  prosseguir.

**Bloqueio real para ativar de verdade:** falta (1) a `GRUPOZAP_WEBHOOK_SECRET_KEY`
real, fornecida pelo Grupo ZAP/OLX no processo de homologação, e (2) criar a
conexão `provider: "GRUPOZAP"` em `/admin/integracoes` e registrar a URL do
webhook (`https://<domínio-api>/api/v1/webhooks/grupozap/leads`) com o Grupo
ZAP. Sem isso, o endpoint responde 503 sempre — nunca finge estar ativo.

## M5 — Publicação centralizada (próximo passo natural)

Spec do feed Vrsync já pesquisada (ver acima) — não implementado ainda.
Arquitetura é o INVERSO de M2: não é um webhook que recebemos, é um XML
público que expomos e a Grupo ZAP busca por polling a cada ~12h. Requisitos
técnicos confirmados (TLS válido não autoassinado, `VivaRealBot/1.0`
liberado no firewall, URL ≤255 caracteres, timeout de conexão 60s/download
20min) — ver `/feeds/connection_guideline.html`.

## M3, M4, M6–M12 — pendentes

Ver a matriz completa em `docs/product/NOVOS_RECURSOS_M0_DIAGNOSTICO.md`.
M9 (catálogo externo licenciado — diferente de M5, que é publicar a carteira
própria) continua sem provedor confirmado.
