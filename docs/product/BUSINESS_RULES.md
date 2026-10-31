# Regras de negócio implementadas

Regras extraídas diretamente do código de domínio e dos serviços — cada uma cita o arquivo-fonte. Nenhum valor abaixo é aproximado; onde há um número, é o número real usado no cálculo.

## Match Score (compatibilidade comprador-imóvel)

Fonte: `packages/domain/src/match/score.ts`, `packages/domain/src/match/weights.ts`.

- Score 0–100, puro e determinístico (sem I/O, sem aleatoriedade), versionado por `rulesetVersion` (`1.0.0`).
- Pesos-base: orçamento 25%, bairro 20%, proximidade 15% (só quando há localização), área 10%, quartos/vagas/características 10%, finalidade 5%, forma de pagamento 5%, sinais de preferência 10%.
- **Reponderação sem localização:** se o comprador não concedeu geolocalização, o peso de proximidade (15%) é redistribuído proporcionalmente entre os outros sete fatores (`reweightWithoutProximity`) — o usuário nunca é penalizado por negar acesso à localização.
- **Critérios eliminatórios** (score 0, `eliminated: true`, sem entrar no ranking): imóvel com `status !== "AVAILABLE"` (`PROPERTY_UNAVAILABLE`) ou imóvel que o próprio comprador marcou como incompatível via `DISLIKE` mais recente que qualquer `LIKE`/`FAVORITE` posterior (`BUYER_EXCLUDED_PROPERTY`).
- **Sub-regras de pontuação:**
  - Orçamento: 1.0 se dentro do teto; decai linearmente até 0 em +20% acima do teto (`BUDGET_HARD_OVER_RATIO`).
  - Bairro: 1.0 se não há preferência de bairro OU o imóvel está em um bairro desejado; 0 caso contrário (binário, sem meio-termo).
  - Área: 1.0 se atende ao mínimo desejado; decai linearmente até 0 em 50% do mínimo (`AREA_SOFT_FLOOR_RATIO`).
  - Quartos/vagas/características: média ponderada (quartos 40%, vagas 20%, características 40%), cada um com seu próprio decaimento proporcional.
  - Proximidade: 1.0 até 500 m (`PROXIMITY_FULL_SCORE_RADIUS_METERS`), decaindo linearmente até 0 em 8.000 m (`PROXIMITY_MAX_RADIUS_METERS`).
  - Patrocínio (`property.isSponsored`) **nunca** entra na fórmula do score — só afeta posicionamento/destaque visual, nunca o ranking de compatibilidade.
- **Motivos explicáveis**: cada sub-score ≥ 0,75 (`REASON_THRESHOLD`) gera um motivo visível (`BUDGET_FIT`, `PREFERRED_AREA`, `AREA_FIT`, `ROOMS_FIT`, `FEATURES_FIT`, `PURPOSE_FIT`, `PAYMENT_FIT`, `PREFERENCE_SIGNAL`); proximidade usa limiar próprio de 0,6 para `NEARBY`.
- Resultado é persistido (`match_results`) a cada leitura de `/matches`, mantendo histórico/auditoria do cálculo.

## Lead Score (priorização comercial, distinto do Match Score)

Fonte: `packages/domain/src/crm/lead-score.ts`.

- Soma de pontos por sinal real de intenção, máximo 100: visualizações (1 ponto cada, até 10), favoritos (2 pontos cada, até 10), contato com corretor (20), visita agendada (25), proposta enviada (35).
- Temperatura derivada do score: `QUENTE` ≥ 60, `MORNO` ≥ 30, `FRIO` abaixo disso.
- Nenhum sinal é inventado — todos vêm de eventos reais (`user_interactions`, `visits`, `proposals`).

## Pipeline de leads (CRM)

Fonte: `packages/contracts/src/leads.ts`.

Estágios, em ordem: `NOVO → QUALIFICANDO → INTERESSE → VISITA_AGENDADA → VISITADO → PROPOSTA → NEGOCIACAO → GANHO | PERDIDO`. Transição para `GANHO` exige `wonAmount`; para `PERDIDO` aceita `lostReason` opcional. Mudança de estágio é uma das ações auditadas (`audit_logs`) quando o resultado é `GANHO`/`PERDIDO` (impacto financeiro).

## Pipeline de captação de proprietário (owner-leads)

Fonte: `packages/contracts/src/owner-leads.ts`.

Estágios: `NOVO → TRIAGEM → APROVADO → CONVERTIDO` (publicação cria um imóvel real no catálogo) ou `REJEITADO` (exige `rejectionReason`). `POST /owner-leads/:id/publish` é a única forma de um owner-lead se tornar um registro em `properties` — não existe criação de imóvel "fantasma" fora desse fluxo ou do CRUD admin direto.

## Comissões e VGV

Fonte: `apps/api/src/commissions/commissions.service.ts`.

- Comissão é criada automaticamente quando um lead vira `GANHO` (`createForWonLead`), com taxa (`rate`) lida de `platform_settings` no momento da criação — mudar a taxa padrão depois nunca altera comissões já geradas (cada registro guarda sua própria `rate` e `baseAmount`).
- Status: `PREVISTO` (ao ser criada) → `RECEBIDO` (confirmação manual com valor e data reais) ou `CANCELADO`.
- `summary()` nunca soma VGV com comissão prevista/recebida na mesma métrica — são três números sempre separados, consistente com a instrução do prompt mestre de não misturar essas métricas.

## Demand Match (demanda agregada por bairro/tipologia) — anti-identificação

Fonte: `apps/api/src/demand-match/demand-match.service.ts`.

- Nunca revela uma contagem de compradores interessados abaixo de um limiar mínimo configurável (`platform_settings.demandMatchThreshold`) — abaixo do limiar, a resposta é `{ count: null, reason: "ABAIXO_DO_LIMIAR" }`, nunca um número aproximado ou "alguns compradores".
- Esse é o padrão "zero honesto": a ausência de dado suficiente é comunicada explicitamente, nunca preenchida com uma estimativa inventada.

## Private Market (off-market)

Fonte: `apps/api/src/private-market/private-market.controller.ts`, `apps/api/src/owner-leads/`.

- Uma oferta só se torna visível/elegível para contato depois de verificada por um admin/gestor (`PATCH /private-market/:id/verify`) — opt-in do proprietário não é suficiente por si só para entrar em circulação.
- Contato de um comprador interessado (`POST /private-market/:id/request-contact`) é sempre intermediado pelo time comercial — gera um lead real no CRM, nunca expõe o contato do proprietário diretamente ao comprador.

## LGPD — exportação, exclusão e retenção

Fonte: `apps/api/src/data-subject-requests/`, `apps/api/src/settings/settings.service.ts`.

- Exportação (`type=EXPORTACAO`) é self-service e instantânea — o próprio comprador não precisa de aprovação para baixar os próprios dados.
- Exclusão (`type=EXCLUSAO`) sempre cria uma solicitação `PENDENTE`; só é efetivada com confirmação explícita de um admin (`CONCLUIDO`) ou recusada com motivo obrigatório (`REJEITADO`).
- Exclusão confirmada anonimiza nome/e-mail/avatar, marca `status=DELETED`, revoga todas as sessões ativas e bloqueia login automaticamente (reaproveita a mesma regra que já bloqueia usuários `SUSPENDED`) — não apaga as linhas históricas (leads, comissões), que permanecem por obrigação legal/contábil já não-identificáveis.
- `dataRetentionDays` é uma configuração visível e editável em Configurações, **sem job automático de purga** — ver `docs/qa/GAPS_REPORT.md`.
