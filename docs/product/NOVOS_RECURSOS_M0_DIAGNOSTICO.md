# Novos recursos — M0: diagnóstico do sistema atual

**Status:** Marcos A–F (roadmap original) estão completos e em produção (ver `docs/qa/GAPS_REPORT.md`, `docs/product/PRD.md`). Este documento é o diagnóstico do M0 de uma nova fase de evolução (M0–M12), feito lendo o código real do repositório — nunca assumindo que algo existe por constar em documentação antiga.

## Confronto de nomenclatura

O produto chama-se **VALORI MATCH**. `PROMPT_MESTRE_ANTIGRAVITY.md` e `README_COMECE_AQUI.md` ainda usam "SPIRE MATCH" — são o documento de especificação original, histórico, não o estado do sistema. `package.json#name` também ainda é `spire-match` e o cookie de sessão é `spire_session` (`apps/api/src/config/env.ts:9`). Não renomeados globalmente aqui, conforme instrução explícita de não fazer renomeações por achar nomes antigos; qualquer rename desses pontos residuais exigiria decisão própria do usuário (afeta nome do pacote pnpm, cookie de sessão de usuários já logados, repositório Git).

## Arquitetura confirmada por leitura de código

- Monorepo pnpm + turborepo: `apps/{web,admin,api,worker}`, `packages/{contracts,domain,api-client,design-tokens,ui-web,configs}`.
- **API**: NestJS modular, um módulo por domínio (`apps/api/src/*/*.module.ts` — 36 módulos). Banco: PostgreSQL + Drizzle ORM, schema em `apps/api/src/database/schema/*.ts` (lat/lng simples, não PostGIS — decisão documentada, suficiente para o volume atual).
- **Worker** (`apps/worker`): BullMQ, **sem acesso direto ao banco** — só agenda e chama `/internal/*` na API (`InternalGuard` + header `INTERNAL_API_KEY`). Padrão "worker-as-scheduler": a lógica de negócio vive uma única vez no serviço Nest síncrono (`MatchesService`, `RadarsService`, `AutomationsService`); o worker nunca duplica regra.
- **Config dinâmica**: `platform_settings` (`key` text PK, `value` jsonb) — tabela genérica de configuração, lida via `SettingsService.get<T>(key, fallback)`. Qualquer novo valor configurável deve passar por aqui, não por coluna/tabela nova, a menos que precise de índice/relação própria.
- **Auditoria**: `audit_logs` (Marco F2), lista curta e deliberada de ações privilegiadas — nunca todo CRUD.
- **Integrações hoje (D6)**: `integrations-status.service.ts` é só um checklist honesto de variáveis de ambiente (maps, S3, SMTP, WhatsApp, LLM, Web Push) — não existe tabela de conexões, nem histórico de eventos, nem retry/idempotência para nenhuma integração externa. **Não existe nenhum conector real com portais imobiliários hoje** (nem recebimento de leads externos, nem publicação de anúncios em terceiros).
- **Outbox/webhooks**: as tabelas `webhook_events`/`outbox_events` previstas no prompt mestre original **nunca foram implementadas** — grep confirmou zero ocorrências no código. Isso é a lacuna central que o M1 precisa preencher.

## Cadastro principal dos imóveis

`properties` (`apps/api/src/database/schema/properties.ts`) é o cadastro principal/catálogo voltado ao comprador — chave `slug`, `status` (DRAFT/…), `brokerId`, preço, specs, localização lat/lng simples. É o que Match, favoritos, visitas, propostas e contatos referenciam.

`developments → development_blocks → units` é o inventário administrativo (Marco D2, com import/export CSV) e é **desacoplado por padrão**: `units.propertyId` é opcional e só é ligado manualmente por um admin quando a unidade também deve aparecer no catálogo do comprador. Isso importa para M5 (publicação centralizada): publicar/atualizar/retirar um anúncio em portal externo deve orbitar em volta de `properties`, não de `units` diretamente, replicando o mesmo desacoplamento deliberado que já existe entre as duas tabelas.

## Fluxos atuais verificados (lendo o código, não a documentação)

| Fluxo | Situação real confirmada |
|---|---|
| **Auth** | Sessão própria (Argon2id, cookie httpOnly), RBAC por `role_assignments`. `users` não tem vínculo com `brokers` (nem `userId` em `brokers`, nem `brokerId` em `users`) — confirmado via grep no schema. Hoje a atribuição de lead a corretor é manual pelo admin (dropdown), não existe resolução automática "corretor logado → minha fila". Isso é uma dependência real para M4. |
| **Carteira** | `properties` (catálogo) + `developments/units` (inventário admin), ver acima. |
| **Busca** | Bounding box indexado + haversine em `packages/domain` (`match/geo.ts`), não PostGIS. |
| **Perfil** | `buyer_profiles` — um registro por usuário, sem distinção entre preferência confirmada e hipótese/inferida (campo único por atributo). Gap real para M3. |
| **Match** | `match_results` — upsert síncrono por par usuário-imóvel, já com `eliminated`/`eliminationReason` e `reasons[]` explicáveis. Base sólida para M3 ampliar. |
| **CRM** | `leads`/`lead_activities` (um lead por comprador, não por imóvel) e `owner_leads`/`owner_lead_activities` espelhando o mesmo pipeline do lado do proprietário. `automation_rules` (uma linha por tipo, ex. `LEAD_AUTO_ASSIGN` round-robin) já existe para D4. |
| **Visitas** | `visits` com índice único parcial `(brokerId, scheduledAt) WHERE status != 'CANCELLED'` — reserva atômica real, sem race condition. |

## Verificações executadas

`pnpm turbo run typecheck lint test build` disparado no início deste diagnóstico contra o estado atual do repo (branch `feat/novos_recursos`, sem nenhuma alteração ainda) — resultado registrado na seção "Baseline" ao final deste documento assim que concluir.

## Matriz M0 — recurso × situação × arquivos × reuso × alteração × dependência × critério de aceite

| Recurso (marco) | Situação atual | Arquivos envolvidos | Componente reutilizável | Alteração necessária | Dependência | Critério de aceite |
|---|---|---|---|---|---|---|
| **M1 — Base das integrações** | Não existe nenhuma tabela/serviço de conexão externa; só o checklist env-var do D6. | `apps/api/src/integrations-status/*`, `apps/api/src/database/schema/*`, `apps/api/src/internal/*`, `apps/worker/src/*` | Padrão worker-as-scheduler, `platform_settings`, `audit_logs`, `InternalGuard` | Novas tabelas (`integration_connections`, `external_id_mappings`, `integration_events`), serviço de ingestão idempotente, endpoint de ativação por conexão | Nenhuma externa (fundação é 100% interna) | Conexão pode ser criada/ativada/desativada por um admin; evento duplicado (mesmo `externalId`+`connectionId`) não duplica efeito; falha registrada e consultável |
| **M2 — Leads externos + histórico unificado** | `leads`/`lead_activities` já cobrem um lead por comprador; não há canal de entrada externo. | `apps/api/src/leads/*`, `apps/api/src/database/schema/leads.ts` | `LeadsService`, dedupe por `userId` único | Resolver identidade (telefone/e-mail) de um contato externo sem `userId` prévio contra um `lead` existente; registrar origem externa na timeline | M1 (tabela de conexões/eventos) | Lead recebido de fonte externa aparece no CRM existente sem duplicar um lead já existente para a mesma pessoa; registro incompleto não derruba dados legítimos já salvos |
| **M3 — Perfil progressivo + match imediato** | `buyer_profiles` é um registro só, sem campo "confirmado vs. hipótese"; `match_results` já tem `eliminated`/`reasons[]`. | `apps/api/src/buyer-profile/*`, `apps/api/src/matches/*`, `packages/domain/src/match/*` | Motor de score existente, estrutura de `reasons` explicáveis | Separar preferência confirmada (editada pelo usuário) de inferida (aprendida por interação); aplicar eliminatórias antes de ordenar (parcialmente já existe) | Nenhuma externa | Preferência inferida nunca sobrescreve uma confirmada sem confirmação do usuário; toda recomendação tem motivo exibível |
| **M4 — Prioridade e distribuição** | `automation_rules` (`LEAD_AUTO_ASSIGN` round-robin) existe; não há vínculo usuário-logado↔corretor. | `apps/api/src/automations/*`, `apps/api/src/brokers/*` | Round-robin já implementado em D4 | Resolver "corretor logado" (precisa de vínculo `users`↔`brokers` ainda inexistente); fila/alertas por responsável | Decisão: como vincular login de corretor a `brokers` (hoje são entidades separadas) | Responsável recebe alerta da própria fila sem ver fila de outro corretor |
| **M5 — Publicação centralizada** | Zero publicação em terceiros hoje; `properties.status` já modela ciclo de vida interno. | `apps/api/src/properties/*`, schema `properties.ts` | Ciclo DRAFT/publicado existente | Fila de publicação por conexão (M1), separar "enviado" de "confirmado pelo portal" | M1 + M9 (acesso real ao portal) | Status de publicação por anúncio×conexão é honesto (nunca mostra "publicado" sem confirmação real) |
| **M6 — Recuperação de oportunidades** | `radars`/`radar_seen_properties` fazem varredura sob demanda; `notifications` tem 5/9 tipos sem nenhum gatilho real (`GAPS_REPORT.md`). | `apps/api/src/radars/*`, `apps/api/src/notifications/*` | Dedupe de radar, `NotificationsService` | Novos gatilhos reais (preço, nova unidade) sobre o motor de radar existente | Nenhuma externa para a parte interna; dados de mercado externos dependem de M9 | Notificação só dispara por evento real, nunca simulado |
| **M7 — Indicadores e inteligência de captação** | `reports`/`commissions` já separam VGV, comissão prevista vs. recebida; atribuição é por empreendimento, não por lead (gap documentado). | `apps/api/src/reports/*`, `apps/api/src/commissions/*` | Relatórios existentes | Novo indicador de "demanda sem oferta" usando `demand-match` (E3) já existente como base | M3 (perfis) para ter sinal de demanda real | Nenhum número inventado; granularidade igual à já documentada em `REVENUE_AND_ATTRIBUTION.md` |
| **M8 — Validação integrada** | Suíte Playwright existe (`tests/e2e`), não cobre nada de M1-M7 (não existiam). | `tests/e2e/*` | Suite e infra de autenticação por `storageState` já existente | Novos specs por incremento | Cada milestone anterior implementado | Specs novos passam, suíte existente continua 100% verde |
| **M9 — Catálogo externo licenciado** | **Nenhum acesso contratado identificado.** Nenhum provedor nomeado pelo usuário até aqui. | — | Padrão D6 de "pendente até credencial real" | Bloqueado: precisa nome do provedor + confirmação de acesso/contrato antes de qualquer código de integração específica | **Decisão do usuário** | Feature fica desativada e claramente marcada como pendente até houver credencial real |
| **M10 — Mesmo imóvel entre anúncios** | Não existe comparador de duplicidade entre fontes (só `/comparar` do lado do comprador, para imóveis já no catálogo). | `apps/web` rota `/comparar`, `packages/domain` | UI de comparação existente | Nova heurística de correspondência entre unidade própria × anúncio externo, com desfazer | M9 | Associação errada é revertida sem perda de dado original |
| **M11 — Match ampliado + radar externo** | Motor de match é 100% sobre `properties` internas. | `apps/api/src/matches/*`, `apps/api/src/radars/*` | Motor de score, radar | Incorporar oferta externa autorizada como insumo, mantendo fonte/responsável visíveis | M9, M10 | Toda oferta externa no match mostra procedência; nunca se mistura com imóvel próprio sem rótulo |
| **M12 — Validação dos recursos externos** | N/A ainda. | — | — | Testes de atualização/retirada/custos/limites | M9–M11 | Pausar fonte externa não afeta operação da carteira própria (verificado por teste) |

## Decisão de arquitetura: isolamento "por imobiliária" (regra 9)

Confirmado por `docs/product/PRD.md`, pelo RBAC (`packages/contracts/src/common.ts` — sem papel tipo `AGENCY_ADMIN`/`ORGANIZATION`) e pela ausência de qualquer tabela `organizations`/`agencies` no schema: **VALORI MATCH é single-tenant — uma única imobiliária (a própria VALORI)**. Não existe hoje, e o prompt mestre original nunca implementou, um modelo multi-empresa (o "parceiro de incorporadora" é um papel de acesso restrito a métricas agregadas do próprio empreendimento, não uma empresa concorrente usando a mesma instância).

**Decisão tomada para o M1 (documentada, não assumida silenciosamente):** tratar "isolar por imobiliária" como "isolar por conexão externa" — cada conexão com um portal/provedor é seu próprio registro, com suas próprias credenciais e seu próprio histórico, sem criar uma tabela de tenant especulativa que nada hoje precisa. Isso evita adicionar uma coluna `organizationId` em dezenas de tabelas existentes (users, properties, leads, brokers…) sem necessidade real — contrário à regra geral do projeto de não introduzir abstração além do necessário. Se a intenção real for transformar VALORI MATCH em SaaS para múltiplas imobiliárias, isso é uma decisão de produto maior que precisa confirmação explícita antes de qualquer migração de schema nessa escala.

## Falhas anteriores identificadas (antes de qualquer mudança)

Nenhuma automática — a última verificação registrada (memória do projeto, Marco F) foi `pnpm turbo run typecheck lint test build --force`: 29/29 verde, e-e-e 29/29. Este M0 está re-executando a mesma verificação no estado atual para confirmar que nada regrediu desde então (resultado abaixo).

## Baseline (resultado da verificação)

`pnpm turbo run typecheck lint test build` — **29/29 tarefas com sucesso** nos 11 pacotes do monorepo (`@spire/admin`, `@spire/api`, `@spire/api-client`, `@spire/configs`, `@spire/contracts`, `@spire/design-tokens`, `@spire/domain`, `@spire/e2e-tests`, `@spire/ui-web`, `@spire/web`, `@spire/worker`), 2m52s. `@spire/domain:test` (23/23) e `@spire/api:test` (2/2) verdes. `@spire/web` e `@spire/admin` geraram build de produção completo, sem erro de TypeScript ou lint. Nenhuma regressão em relação ao estado final do Marco F registrado em memória. Confirma que o repositório está limpo para iniciar o M1 sem nenhuma pendência anterior.
