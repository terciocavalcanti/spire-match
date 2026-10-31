# Política de notificações

## Tipos reais (`packages/contracts/src/notifications.ts` → `NOTIFICATION_TYPES`)

9 tipos existem no enum/schema. **4 têm gatilho real implementado hoje**;
os outros 5 existem no modelo de dados mas nenhum código ainda os dispara —
listados honestamente como lacuna, não escondidos.

| Tipo | Gatilho real | Arquivo |
|---|---|---|
| `VISIT_CONFIRMED` | Comprador agenda visita com sucesso | `apps/api/src/visits/visits.service.ts` |
| `PROPOSAL_UPDATE` | Comprador registra uma proposta | `apps/api/src/proposals/proposals.service.ts` |
| `RADAR_HIT` | Varredura de radar (job `radar-sweep` do worker) encontra imóvel novo compatível | `apps/api/src/radars/radars.service.ts` |
| `LEAD_SIGNAL` | Sinal de lead relevante (ex. atividade do funil) e tick de automação (job `automation-tick`) | `apps/api/src/leads/leads.service.ts`, `apps/api/src/automations/automations.service.ts` |
| `MATCH_NEW` | **Sem gatilho implementado** | — |
| `PRICE_DROP` | **Sem gatilho implementado** | — |
| `VISIT_REMINDER` | **Sem gatilho implementado** (lembrete antes da visita, não só a confirmação) | — |
| `EXCLUSIVE_NEW` | **Sem gatilho implementado** | — |
| `SYSTEM` | **Sem gatilho implementado** | — |

`MATCH_NEW`/`PRICE_DROP` seriam os candidatos naturais a disparar a partir do
recálculo de Match no worker (`match-recalc-buyer`/`match-recalc-property`),
mas esse caminho hoje só persiste o novo `score` em `match_results` — não
chama `NotificationsService.notify(...)`. Implementar isso é trabalho futuro,
não uma regressão desta fase.

## Como uma notificação é criada

Toda notificação passa por um único ponto: `NotificationsService.notify(userId, type, title, body, linkUrl?)`
(`apps/api/src/notifications/notifications.service.ts`). O método:

1. Insere a linha em `notifications` (lida pelo sino/lista em `/notificacoes`
   via `GET /notifications`, `markRead`, `markAllRead`).
2. Dispara `dispatchPush(...)` em paralelo (best-effort — falha de push não
   derruba a notificação em si, que já foi persistida).

## Canais de entrega

| Canal | Status real | Detalhe |
|---|---|---|
| In-app (lista/sino) | **Real**, sempre ativo | Não depende de credencial externa — é só leitura da tabela `notifications` |
| Web Push (W3C Push API + VAPID) | **Real quando configurado** | `apps/api/src/notifications/web-push.service.ts`. Par de chaves VAPID é gerado localmente (não depende de provedor terceiro), mas requer `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY` setadas — sem elas, `dispatchPush` é no-op silencioso |
| E-mail | **Não implementado** | `SMTP_URL` existe em `env.ts` mas nenhum serviço de notificação o lê hoje; Mailhog só é usado para e-mails transacionais de auth (verificação/redefinição de senha), não para os 9 tipos de notificação acima |
| WhatsApp (Business Cloud API) | **Não implementado** | Ver `docs/operations/WHATSAPP_TEMPLATES.md` — existe só um link `wa.me` client-side, não um canal de notificação server-initiated |

`apps/api/src/integrations-status/integrations-status.service.ts` expõe o
status real (`ATIVO`/`PENDENTE`) desses canais para o painel admin, a partir
da simples presença das variáveis de ambiente — nunca simula um canal como
ativo sem a credencial real.
