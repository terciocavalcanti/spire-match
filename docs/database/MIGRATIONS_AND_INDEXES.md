# Migrações e índices — VALORI MATCH

## Migrações (em ordem)

Geradas por `drizzle-kit generate` a partir do schema real (nunca escritas à
mão). Caminho: `apps/api/src/database/migrations/*.sql`.

| # | Arquivo | O que faz |
|---|---------|-----------|
| 0000 | `lyrical_roulette.sql` | Base de identidade: `users`, `roles`, `role_assignments`, `user_sessions`, `consents`, `password_reset_tokens`, `email_verifications`. |
| 0001 | `salty_luminals.sql` | Catálogo de imóveis: `properties` (+ índices `status`/`neighborhood`/`lat,lng`/`price`), `property_images`, `property_price_history`, `buyer_profiles`, `favorites`, `user_interactions`, `match_results`. |
| 0002 | `clumsy_meggan.sql` | `brokers`, `visits`, `proposals`, `contacts`, `notifications`, `push_subscriptions`, `radars`, `radar_seen_properties`; adiciona `properties.broker_id`. |
| 0003 | `broken_tiger_shark.sql` | CRM do comprador: enums `lead_activity_type`/`lead_stage`, tabelas `leads`, `lead_activities`. |
| 0004 | `tan_black_cat.sql` | `ALTER TYPE notification_type ADD VALUE 'LEAD_SIGNAL'`. |
| 0005 | `bizarre_toad_men.sql` | `ALTER TABLE users ADD COLUMN must_change_password`. |
| 0006 | `hot_blink.sql` | Incorporadoras: `developments`, `development_blocks`, `units`, `unit_price_history`. |
| 0007 | `neat_sunspot.sql` | `platform_settings`, `commissions`, `lead_touchpoints`. |
| 0008 | `slippery_fixer.sql` | `automation_rules`. |
| 0009 | `dusty_gargoyle.sql` | Captação do lado do proprietário: `owner_leads`, `owner_lead_activities`. |
| 0010 | `wooden_mother_askani.sql` | Mercado Privado: `private_market_offers`, `private_market_consents`, `private_market_contact_requests`. |
| 0011 | `tiny_blur.sql` | `campaigns`, `development_partner_access`. |
| 0012 | `milky_sasquatch.sql` | Pulse/Club: `market_indicators`, `partners`. |
| 0013 | `handy_supreme_intelligence.sql` | `audit_logs` (Marco F2). |
| 0014 | `condemned_garia.sql` | `data_subject_requests` (Marco F3). |

## Índices e constraints reais hoje

Levantado por grep de `.unique()`, `uniqueIndex(`, `index(` em
`apps/api/src/database/schema/*.ts` — não é uma lista aspiracional.

| Tabela | Índice/constraint | Tipo |
|---|---|---|
| `users` | `email` | unique |
| `user_sessions` | `session_token_hash` | unique |
| `password_reset_tokens` | `token_hash` | unique |
| `email_verifications` | `token_hash` | unique |
| `role_assignments` | `(user_id, role_id)` | unique |
| `properties` | `slug` | unique |
| `properties` | `status`, `neighborhood`, `(lat, lng)`, `price` | índice simples (4) |
| `property_images` | `property_id` | índice simples |
| `buyer_profiles` | `user_id` | unique |
| `favorites` | `(user_id, property_id)` | unique |
| `user_interactions` | `user_id`, `property_id`, `type` | índice simples (3) |
| `match_results` | `(user_id, property_id)` | unique (upsert) |
| `brokers` | `email` | unique |
| `visits` | `(broker_id, scheduled_at)` onde `status != 'CANCELLED'` | unique parcial |
| `proposals` | `user_id` | índice simples |
| `contacts` | `user_id` | índice simples |
| `notifications` | `(user_id, created_at)` | índice composto |
| `push_subscriptions` | `endpoint` (unique), `user_id` (índice) | ambos |
| `radar_seen_properties` | `(radar_id, property_id)` (unique), `radar_id` (índice) | ambos |
| `leads` | `user_id` (unique), `stage`, `assigned_broker_id` | 3 |
| `lead_activities` | `(lead_id, created_at)` | índice composto |
| `developments` | `slug` (unique), `status` (índice) | ambos |
| `development_blocks` | `development_id` | índice simples |
| `units` | `development_id`, `status` | índice simples (2) |
| `lead_touchpoints` | `(lead_id, occurred_at)` | índice composto |
| `commissions` | `status`, `broker_id` | índice simples (2) |
| `owner_leads` | `stage`, `assigned_broker_id` | índice simples (2) |
| `owner_lead_activities` | `(owner_lead_id, created_at)` | índice composto |
| `private_market_offers` | `owner_lead_id` (unique), `status` (índice) | ambos |
| `private_market_consents` | `owner_lead_id` | unique |
| `private_market_contact_requests` | `offer_id` | índice simples |
| `campaigns` | `status`, `development_id` | índice simples (2) |
| `development_partner_access` | `(development_id, user_id)` | unique composto |
| `audit_logs` | `created_at`, `action`, `entity_type` | índice simples (3) |
| `data_subject_requests` | `status`, `user_id` | índice simples (2) |

Tabelas sem índice próprio além da PK: `role_assignments`-alvo já cobertas
acima, `platform_settings` (PK é `key`, suficiente — leitura sempre por
chave exata), `automation_rules` (PK é `type`, idem), `market_indicators`,
`partners` (ambas pequenas, sem filtro de alto volume hoje).

## O que falta (verificado, não especulado)

Dois casos confirmados por leitura direta do código de serviço (não é
suposição — a query real roda sem índice de apoio):

1. **`audit_logs.actor_user_id` sem índice.** `AuditLogService` filtra por
   `eq(auditLogs.actorUserId, query.actorUserId)` quando o admin busca a
   trilha por ator (`apps/api/src/audit/audit-log.service.ts`), mas a
   tabela só indexa `created_at`/`action`/`entity_type`. Hoje é inofensivo
   (poucas linhas), mas cresce de forma ilimitada — vira sequential scan
   caro assim que o volume de auditoria aumentar.
2. **`development_partner_access.user_id` sem índice próprio.**
   `listMine(userId)` filtra só por `user_id`
   (`apps/api/src/development-partner-access/development-partner-access.service.ts:106`,
   chamada a cada carregamento do painel da incorporadora), mas o único
   índice existente é composto `(development_id, user_id)` — o Postgres só
   usa esse índice quando `development_id` também está no filtro
   (leftmost-prefix), então essa query específica não é servida por ele.

Nenhuma outra tabela/consulta apresentou esse padrão nos services
inspecionados nesta rodada (properties/matches/leads, ver
`docs/qa/TEST_RESULTS.md`, não mostraram sinal de sequential scan nos números
reais medidos). Os dois itens acima ficam registrados para correção —
adicionar um índice simples em cada coluna é uma migração de risco
essencialmente zero (só `CREATE INDEX`, sem mudança de dado ou de código de
aplicação).
