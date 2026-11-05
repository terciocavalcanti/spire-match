# ERD — VALORI MATCH

Gerado a partir do schema real em `apps/api/src/database/schema/*.ts` (Drizzle
ORM, Postgres). 46 tabelas em 9 grupos de domínio. Todo FK/coluna abaixo
existe hoje no código — nada aspiracional.

## 1. Identidade e acesso

```mermaid
erDiagram
  USERS ||--o{ ROLE_ASSIGNMENTS : possui
  ROLES ||--o{ ROLE_ASSIGNMENTS : concede
  USERS ||--o{ USER_SESSIONS : autentica
  USERS ||--o{ PASSWORD_RESET_TOKENS : solicita
  USERS ||--o{ EMAIL_VERIFICATIONS : verifica
  USERS ||--o{ CONSENTS : registra

  USERS {
    uuid id PK
    text name
    text email "unique"
    text password_hash
    enum status "ACTIVE/SUSPENDED/DELETED"
    boolean must_change_password
    timestamp deleted_at
  }
  ROLES {
    uuid id PK
    enum name "unique — BUYER/BROKER/ADMIN/SUPER_ADMIN/SALES_MANAGER/DEVELOPER_PARTNER..."
  }
  ROLE_ASSIGNMENTS {
    uuid id PK
    uuid user_id FK
    uuid role_id FK
  }
  USER_SESSIONS {
    uuid id PK
    uuid user_id FK
    text session_token_hash "unique, SHA-256"
    timestamp expires_at
    timestamp revoked_at
  }
  CONSENTS {
    uuid id PK
    uuid user_id FK
    enum purpose
    boolean granted
    text version
    jsonb evidence
  }
```

`role_assignments` tem índice único `(user_id, role_id)` — um usuário pode ter
múltiplos papéis, mas nunca o mesmo papel duplicado. `consents` é append-only:
o consentimento vigente é a linha mais recente por `(user_id, purpose)`, nunca
um UPDATE.

## 2. Catálogo de imóveis

```mermaid
erDiagram
  BROKERS ||--o{ PROPERTIES : atende
  PROPERTIES ||--o{ PROPERTY_IMAGES : exibe
  PROPERTIES ||--o{ PROPERTY_PRICE_HISTORY : registra

  PROPERTIES {
    uuid id PK
    text slug "unique"
    enum type
    enum purpose
    enum status "DRAFT/AVAILABLE/..."
    numeric price
    numeric area_sqm
    double lat
    double lng
    boolean is_exclusive
    boolean is_sponsored
    uuid broker_id FK "nullable"
    timestamp deleted_at
  }
  BROKERS {
    uuid id PK
    text email "unique"
    text creci
  }
```

`properties` já nasceu indexada (`status`, `neighborhood`, `(lat,lng)`,
`price`) — ver `docs/database/MIGRATIONS_AND_INDEXES.md`. Localização é
`lat`/`lng` simples, não PostGIS `geography` — simplificação documentada no
próprio schema (comentário em `properties.ts`), suficiente para o volume
atual.

## 3. Comprador e engajamento

```mermaid
erDiagram
  USERS ||--|| BUYER_PROFILES : tem
  USERS ||--o{ FAVORITES : favorita
  PROPERTIES ||--o{ FAVORITES : "é favoritado"
  USERS ||--o{ USER_INTERACTIONS : interage
  USERS ||--o{ MATCH_RESULTS : recebe
  USERS ||--o{ VISITS : agenda
  BROKERS ||--o{ VISITS : recebe
  USERS ||--o{ PROPOSALS : envia
  USERS ||--o{ CONTACTS : solicita
  USERS ||--o{ RADARS : cria
  RADARS ||--o{ RADAR_SEEN_PROPERTIES : "já notificou"
  USERS ||--o{ NOTIFICATIONS : recebe
  USERS ||--o{ PUSH_SUBSCRIPTIONS : assina

  BUYER_PROFILES {
    uuid id PK
    uuid user_id FK "unique"
    numeric budget_min
    numeric budget_max
    text[] desired_neighborhoods
  }
  MATCH_RESULTS {
    uuid id PK
    uuid user_id FK
    uuid property_id FK
    int score
    jsonb reasons
    boolean eliminated
  }
  VISITS {
    uuid id PK
    uuid user_id FK
    uuid property_id FK
    uuid broker_id FK
    timestamp scheduled_at
    enum status
  }
  RADARS {
    uuid id PK
    uuid user_id FK
    jsonb criteria
    boolean active
    timestamp last_checked_at
  }
```

`match_results` tem índice único `(user_id, property_id)` — upsert, não
histórico (última pontuação calculada por par comprador/imóvel). `visits` tem
índice único **parcial** `(broker_id, scheduled_at) WHERE status != 'CANCELLED'`
— garante no banco que dois compradores nunca reservam o mesmo horário do
mesmo corretor.

## 4. CRM comercial (funil do comprador)

```mermaid
erDiagram
  USERS ||--|| LEADS : "é"
  PROPERTIES ||--o{ LEADS : origina
  BROKERS ||--o{ LEADS : atende
  LEADS ||--o{ LEAD_ACTIVITIES : registra
  LEADS ||--o{ LEAD_TOUCHPOINTS : registra
  LEADS ||--o{ COMMISSIONS : gera
  BROKERS ||--o{ COMMISSIONS : recebe
  PROPERTIES ||--o{ COMMISSIONS : refere

  LEADS {
    uuid id PK
    uuid user_id FK "unique — 1 lead por comprador"
    uuid source_property_id FK "nullable"
    uuid assigned_broker_id FK "nullable"
    enum stage "NOVO..GANHO/PERDIDO"
    int score
    numeric won_amount
  }
  COMMISSIONS {
    uuid id PK
    uuid lead_id FK
    numeric base_amount
    numeric rate
    numeric previsto_amount
    numeric recebido_amount
    enum status "PREVISTO/RECEBIDO/CANCELADO"
  }
```

`leads.user_id` é único: o time comercial acompanha a pessoa, não um evento
isolado. `commissions` é criada automaticamente quando um lead vira `GANHO` —
`rate`/`previsto_amount` são um retrato do momento da criação (mudar a taxa
padrão depois não altera comissões já geradas).

## 5. Captação (proprietário) e Mercado Privado

```mermaid
erDiagram
  USERS ||--|| OWNER_LEADS : "é"
  BROKERS ||--o{ OWNER_LEADS : atende
  PROPERTIES ||--o| OWNER_LEADS : "vira (linked_property_id)"
  OWNER_LEADS ||--o{ OWNER_LEAD_ACTIVITIES : registra
  OWNER_LEADS ||--|| PRIVATE_MARKET_OFFERS : "pode gerar"
  OWNER_LEADS ||--|| PRIVATE_MARKET_CONSENTS : "pode ter"
  PRIVATE_MARKET_OFFERS ||--o{ PRIVATE_MARKET_CONTACT_REQUESTS : recebe
  USERS ||--o{ PRIVATE_MARKET_CONTACT_REQUESTS : solicita

  OWNER_LEADS {
    uuid id PK
    uuid user_id FK
    uuid assigned_broker_id FK "nullable"
    enum stage
    enum intent
    uuid linked_property_id FK "nullable — setado no publish"
    timestamp consent_capture_at "carimbado pelo servidor"
  }
  PRIVATE_MARKET_OFFERS {
    uuid id PK
    uuid owner_lead_id FK "unique"
    enum status "PENDENTE_VERIFICACAO/ELEGIVEL/..."
    numeric min_price
    text anonymized_summary
    uuid verified_by_user_id FK
  }
```

Espelha o grupo 4 (mesmo pipeline comercial, dono dos dados diferente).
`linked_property_id` em `owner_leads` é o que fecha o laço "captação →
imóvel real no catálogo" (`OwnerLeadsService.publish`). `private_market_offers`
fica `PENDENTE_VERIFICACAO` até o time comercial preencher resumo anonimizado
+ preço mínimo.

## 6. Incorporadoras, parcerias e conteúdo

```mermaid
erDiagram
  DEVELOPMENTS ||--o{ DEVELOPMENT_BLOCKS : organiza
  DEVELOPMENTS ||--o{ UNITS : contém
  DEVELOPMENT_BLOCKS ||--o{ UNITS : agrupa
  UNITS ||--o{ UNIT_PRICE_HISTORY : registra
  UNITS ||--o| PROPERTIES : "pode espelhar"
  DEVELOPMENTS ||--o{ CAMPAIGNS : promove
  DEVELOPMENTS ||--o{ DEVELOPMENT_PARTNER_ACCESS : libera
  USERS ||--o{ DEVELOPMENT_PARTNER_ACCESS : acessa

  DEVELOPMENTS {
    uuid id PK
    text slug "unique"
    enum status
    text incorporator_name "texto livre"
    numeric price_from
  }
  UNITS {
    uuid id PK
    uuid development_id FK
    uuid block_id FK "nullable"
    uuid property_id FK "nullable — vínculo manual"
    enum status
  }
  DEVELOPMENT_PARTNER_ACCESS {
    uuid id PK
    uuid development_id FK
    uuid user_id FK
    uuid granted_by_user_id FK
  }
  CAMPAIGNS {
    uuid id PK
    uuid development_id FK "nullable"
    enum type
    enum status
  }
  MARKET_INDICATORS {
    uuid id PK
    text title
    numeric value
    text source "NOT NULL — nunca publica sem proveniência"
    text methodology "NOT NULL"
  }
  PARTNERS {
    uuid id PK
    enum category
    date valid_until
  }
```

`development_partner_access` é a tabela que decide quais empreendimentos
aparecem para um usuário com papel `DEVELOPER_PARTNER` — concedida
explicitamente pelo time comercial, nunca automática; a segurança real está
nos guards de cada endpoint (ver `docs/security/RBAC.md`). `market_indicators`
(Pulse) e `partners` (Club) são cadastrados manualmente — sem provedor de
dados externo integrado ainda.

## 7. Configuração e automação

```mermaid
erDiagram
  USERS ||--o{ PLATFORM_SETTINGS : edita
  USERS ||--o{ AUTOMATION_RULES : edita

  PLATFORM_SETTINGS {
    text key PK
    jsonb value
    uuid updated_by_user_id FK
  }
  AUTOMATION_RULES {
    enum type PK
    boolean enabled
    jsonb config
    int round_robin_cursor
  }
```

Chave/valor deliberado: uma linha por configuração, ausência de linha usa o
fallback de código documentado no `SettingsService` — nunca falha por
configuração ausente. `automation_rules` é uma linha por tipo (sem múltiplas
regras do mesmo tipo).

## 8. Auditoria e LGPD

```mermaid
erDiagram
  USERS ||--o{ AUDIT_LOGS : pratica
  USERS ||--o{ DATA_SUBJECT_REQUESTS : solicita
  USERS ||--o{ DATA_SUBJECT_REQUESTS : resolve

  AUDIT_LOGS {
    uuid id PK
    uuid actor_user_id FK "nullable, on delete SET NULL"
    text actor_email "snapshot — sobrevive a exclusão LGPD do ator"
    text action
    text entity_type
    jsonb metadata
  }
  DATA_SUBJECT_REQUESTS {
    uuid id PK
    uuid user_id FK
    enum type "EXPORTACAO/EXCLUSAO"
    enum status "PENDENTE/CONCLUIDO/REJEITADO"
    uuid handled_by_user_id FK "nullable"
    text rejection_reason
  }
```

`audit_logs.actor_email` é uma cópia, não um JOIN — sobrevive a uma exclusão
LGPD do próprio ator sem quebrar o histórico. `data_subject_requests` de tipo
`EXPORTACAO` já nasce `CONCLUIDO` (resolvida na hora); `EXCLUSAO` fica
`PENDENTE` até confirmação ou rejeição do time comercial (ver
`docs/security/LGPD_DATA_MAP.md`).

## 9. Integrações externas (fundação — "novos recursos" M1)

```mermaid
erDiagram
  INTEGRATION_CONNECTIONS ||--o{ INTEGRATION_EVENTS : recebe
  INTEGRATION_CONNECTIONS ||--o{ INTEGRATION_EXTERNAL_REFS : mapeia
  USERS ||--o{ INTEGRATION_CONNECTIONS : edita

  INTEGRATION_CONNECTIONS {
    uuid id PK
    text provider "texto livre — nenhum provedor nomeado/credenciado ainda"
    text label
    enum direction "ENTRADA/SAIDA/AMBAS"
    enum status "PENDENTE/ATIVA/PAUSADA"
    jsonb config
    timestamp last_error_at
    text last_error_message
  }
  INTEGRATION_EVENTS {
    uuid id PK
    uuid connection_id FK
    enum direction "ENTRADA/SAIDA"
    text event_type
    text external_event_id "nullable — chave de dedupe quando a fonte fornece"
    jsonb payload
    enum status "PENDENTE/PROCESSADO/FALHOU/DUPLICADO"
    int attempts
  }
  INTEGRATION_EXTERNAL_REFS {
    uuid id PK
    uuid connection_id FK
    text entity_type "texto livre, ex.: PROPERTY/LEAD"
    uuid internal_id
    text external_id
  }
```

Fundação provider-agnóstica: nenhum conector concreto existe ainda (ver
`docs/product/NOVOS_RECURSOS_M0_DIAGNOSTICO.md`). `integration_events` tem
índice único parcial `(connection_id, external_event_id) WHERE external_event_id
IS NOT NULL` — dedupe real sob concorrência, não heurística em memória,
verificado contra Postgres real (não só mockado). "Isolar por imobiliária" é
tratado como isolar por CONEXÃO: o sistema é single-tenant (uma única
imobiliária), sem tabela de organização/tenant.
