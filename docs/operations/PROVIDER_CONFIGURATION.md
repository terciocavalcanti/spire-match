# Configuração de provedores externos

Fonte de verdade: `apps/api/src/config/env.ts` (validado via Zod no boot —
a API não inicia se uma variável obrigatória faltar). Todas as variáveis de
provedor terceiro abaixo são `.optional()` no schema: a API **sobe e
funciona em dev sem nenhuma delas**, com os recursos correspondentes
simplesmente desligados (nunca simulados como ativos).

| Variável | Usada por | Status real | Produção |
|---|---|---|---|
| `DATABASE_URL` | Drizzle (toda a API) | **Obrigatória**, sem fallback | Credenciais reais do Postgres/PostGIS |
| `REDIS_URL` | `QueueService` (api), `apps/worker` | Tem default `redis://localhost:6379` para dev | Apontar para o Redis do compose de produção |
| `INTERNAL_API_KEY` | Protege rotas `/internal/*` (chamadas só pelo worker) | **Obrigatória** (mín. 16 caracteres) | Gerar um segredo real, nunca reaproveitar o de dev |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | `apps/api/src/notifications/web-push.service.ts` | **Real quando presente** — não depende de provedor terceiro, é um par de chaves gerado localmente | Gerar um par real e configurar nos 3 ambientes (dev/staging/produção não devem compartilhar chave) |
| `MAPTILER_API_KEY` (API) | Apenas verificado em `integrations-status.service.ts` — **nenhum serviço da API faz chamada a mapas** | Placeholder | — |
| `NEXT_PUBLIC_MAPTILER_API_KEY` (web, `.env.example` do app) | `apps/web/src/components/map/PropertyMap.tsx` | **Real, ativado em 2026-11-01** (conta grátis) — tiles de mapa do plano MapTiler Streets; sem a chave, cai para o tile server bruto do OpenStreetMap (fallback honesto, não quebra, mas não é o caminho recomendado para produção) | Já configurada em dev; configurar a mesma chave (ou uma de produção própria) no deploy |
| `NEXT_PUBLIC_GEOAPIFY_API_KEY` (web, `.env.example` do app) | `apps/web/src/hooks/use-nearby-places.ts` (City/Life na tela do imóvel) e `apps/web/src/hooks/use-route.ts` (rota desenhada em `/mapa`) | **Real, ativado em 2026-11-01** (conta grátis, 3.000 créditos/dia, uso comercial permitido) — sem a chave, ambos os recursos ficam desativados (City/Life mostra aviso de localização indisponível; a rota simplesmente não aparece) | Já configurada em dev; configurar a mesma chave (ou uma de produção própria) no deploy |
| `S3_ENDPOINT` / `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` / `S3_BUCKET` | Apenas verificado em `integrations-status.service.ts` — **nenhum serviço faz upload/leitura de objeto S3** | Placeholder | Fotos de imóveis hoje são URLs externas seedadas, não upload de usuário — implementar upload real é trabalho futuro |
| `SMTP_URL` | Apenas verificado em `integrations-status.service.ts` para o painel; e-mails transacionais de auth (verificação/redefinição de senha) usam Mailhog em dev via essa mesma variável | Real em dev (Mailhog), placeholder em produção | Configurar um SMTP real (ou provedor transacional) antes do lançamento |
| `WHATSAPP_CLOUD_API_TOKEN` / `WHATSAPP_PHONE_NUMBER_ID` | Apenas verificado em `integrations-status.service.ts` | Placeholder — ver `docs/operations/WHATSAPP_TEMPLATES.md` | Sem envio implementado; configurar só terá efeito depois que o adapter de envio for escrito |
| `LLM_PROVIDER_API_KEY` | Apenas verificado em `integrations-status.service.ts` — a busca "IA" (`AiSearchService`) usa um parser determinístico de `packages/domain`, **não chama nenhum LLM** | Placeholder | Integrar um LLM real é trabalho futuro — o parser atual já cobre a função sem depender de credencial |

## Resumo honesto

Hoje, em produção, os únicos provedores **realmente necessários** para o
sistema funcionar de ponta a ponta são: Postgres, Redis, e um par de chaves
VAPID (para Web Push). Mapas funcionam com um basemap de terceiro sem chave
própria configurada (risco: pode parar de funcionar sem aviso — ver
comentário em `PropertyMap.tsx`). S3, SMTP real, WhatsApp e LLM são lacunas
reais de configuração para produção, listadas em `docs/qa/GAPS_REPORT.md`.
