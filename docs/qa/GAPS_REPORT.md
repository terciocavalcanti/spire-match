# Relatório de lacunas — Marco F (final)

Lista honesta do que **não** está pronto ao final do Marco F, para não ser
confundida com o que está. Cada item foi verificado lendo código real
(schema, serviços, config), nunca suposto. Itens já corrigidos durante este
marco (ex.: contraste de cor, índices faltantes) não aparecem aqui — só o
que permanece pendente.

## Integrações externas — placeholder, não ativas

Todas confirmadas lendo `apps/api/src/config/env.ts` e os pontos reais de
uso (ou ausência deles):

- **WhatsApp**: `WHATSAPP_CLOUD_API_TOKEN`/`WHATSAPP_PHONE_NUMBER_ID`
  existem no schema de ambiente, mas **não há nenhum envio real via Cloud
  API no código**. O único touchpoint de WhatsApp é um link `wa.me` do lado
  do cliente para o telefone real do corretor — funciona, mas não é a
  integração server-side que o prompt mestre previa. Ver
  `docs/operations/WHATSAPP_TEMPLATES.md`.
- **LLM / busca por IA**: `LLM_PROVIDER_API_KEY` existe, mas `POST /ai/search`
  usa um parser determinístico em `packages/domain`, não uma chamada real a
  um provedor de LLM. Funciona para o conjunto de padrões cobertos, mas não
  é busca por IA generativa.
- **S3 / upload de mídia**: `S3_*` existe no schema de ambiente, mas as
  fotos de imóvel no catálogo são URLs estáticas semeadas (seed), não
  upload real para um bucket. Nenhum fluxo de upload está implementado.
- ~~**MapTiler**: desativado, não verificado com conta real~~ — **ativado
  em 2026-11-01** com `NEXT_PUBLIC_MAPTILER_API_KEY` real (conta grátis).
  Tiles do mapa (`/mapa`) confirmados funcionando.
- ~~**City/Life (vizinhança)**: placeholder "pendente de provedor
  licenciado" na tela do imóvel~~ — **ativado em 2026-11-01** via
  Geoapify Places API (`NEXT_PUBLIC_GEOAPIFY_API_KEY`, conta grátis,
  3.000 créditos/dia, uso comercial permitido). A mesma chave também
  substituiu o servidor de demonstração público do OSRM pelo Routing
  API real do Geoapify na rota desenhada em `/mapa`.
- **SMTP em produção**: funciona via Mailhog em dev; nenhuma conta SMTP de
  produção foi configurada ou testada.

Nenhuma dessas integrações é simulada como ativa em nenhuma tela — todas
aparecem corretamente como pendentes em `integrations-status.service.ts`.
Mas isso significa que, até alguém configurar credenciais reais e (no caso
de WhatsApp/S3/LLM) **escrever a integração de envio/upload real**, essas
funcionalidades não existem em produção, só o contrato/preparo para elas.

## Notificações — metade dos tipos sem gatilho real

Do enum de tipos de notificação, apenas 4 têm algum ponto real no código
que as dispara: `VISIT_CONFIRMED`, `PROPOSAL_UPDATE`, `RADAR_HIT`,
`LEAD_SIGNAL`. Os outros 5 (`MATCH_NEW`, `PRICE_DROP`, `VISIT_REMINDER`,
`EXCLUSIVE_NEW`, `SYSTEM`) existem no schema/UI mas **nenhum serviço os
cria** — são tipos previstos, não implementados. Ver
`docs/operations/NOTIFICATION_POLICY.md`.

## LGPD — sem purga automática de retenção

`dataRetentionDays` é um valor configurável e exibido
(`/admin/configuracoes`), mas **nenhum job apaga ou anonimiza dados
automaticamente** ao atingir o prazo. A única exclusão real é a solicitação
manual do titular + confirmação do time comercial (Marco F3). Decisão
deliberada (risco de apagar dados em massa sem supervisão ficou fora do
orçamento deste marco), mas é uma lacuna de conformidade real enquanto não
for implementada. Ver `docs/security/LGPD_DATA_MAP.md`.

Relacionado: a tabela genérica `consents` (consentimento de marketing) é
lida mas nunca escrita por nenhum fluxo hoje — só
`private_market_consents` captura consentimento de verdade.

## Segurança — itens não mitigados

Lista completa e o porquê de cada um em `docs/security/THREAT_MODEL.md`;
resumo:

- `SESSION_COOKIE_SECURE` tem default `false` — depende de quem configurar
  o deploy lembrar de ativar (já é item do
  `docs/deployment/PRODUCTION_LAUNCH_CHECKLIST.md`).
- Sem MFA/2FA para nenhum papel, incluindo ADMIN/SUPER_ADMIN.
- Sem token CSRF dedicado (double-submit) — mitigado por `SameSite=Lax` +
  `OriginGuard`, suficiente hoje, mas não à prova de um cliente nativo
  futuro que não envie `Origin`.
- Sem scanner automatizado de dependências (Dependabot/CodeQL/`pnpm audit`)
  no CI.
- **Nenhum teste de penetração foi realizado.**
- Rate limit é por IP, não por conta — não desacelera um atacante com
  múltiplos IPs.
- `POST /ai/search` é público, sem teto de custo por conta (só throttle de
  IP) — risco financeiro, não só de segurança.
- Swagger (`/api/docs`) é público em qualquer ambiente, incluindo produção.

## Testes — cobertura real, não 100%

- **Testes de unidade**: só a lógica pura de `packages/domain` (Match
  Engine, score de lead, parsing de IA, roteirização) e um único pipe da
  API têm teste dedicado. Nenhum controller/service da API tem teste de
  unidade/integração — a cobertura desses caminhos vem só da suíte e2e e de
  verificação manual feita a cada marco (não persistida). Ver
  `docs/qa/TEST_PLAN.md`.
- **Suíte e2e não está no pipeline de CI** (`.github/workflows/deploy.yml`)
  — roda manualmente contra a stack local. O CI hoje gira
  `typecheck lint test build`, não `test:e2e`, porque o runner não sobe
  Postgres/Redis/a stack completa.
- **Sem diff visual automatizado** (pixel-a-pixel contra as referências
  originais) — a verificação de fidelidade visual é manual/por screenshot,
  nunca uma baseline comparada automaticamente. Ver
  `docs/ui/VISUAL_FIDELITY_REPORT.md` e `docs/qa/VISUAL_DIFFS.md`.
- **Sem teste em hardware físico real** (celular/tablet de verdade) — a
  cobertura de "PWA cross-device" é uma matriz de viewports simulados no
  Playwright (`specs/responsive.spec.ts`), não dispositivos reais.
- Violações de acessibilidade `moderate` (meta-viewport, ausência de `h1`
  em `/explorar`) são logadas pela suíte, não corrigidas neste marco —
  escopo ficou limitado a violações `critical`/`serious`.

## Performance — números são de dev, não de produção

`scripts/load-test.mjs` mede latência real contra a stack local (ver
`docs/qa/TEST_RESULTS.md`), mas **nunca em escala/hardware de produção**.
Nenhum número de capacidade de produção foi medido ou estimado — qualquer
afirmação de "suporta X usuários simultâneos" seria fabricada e não deve
ser feita até um teste de carga real contra o ambiente de produção.

## Backup e deploy

- **Backup é manual**, sem cron/agendamento nem cópia automática para fora
  da VPS configurados hoje — procedimento documentado e pronto para rodar
  em `docs/deployment/BACKUP_RESTORE.md`, mas não agendado.
- **Migrations são só para frente** — não há mecanismo de down-migration;
  revertê-las exige restaurar backup ou escrever uma migration corretiva
  manual. Ver `docs/deployment/ROLLBACK.md`.

## Atribuição de receita — granularidade real

Campanhas rastreiam origem/atribuição por **empreendimento**, não por
campanha individual ou por lead — não há rastreamento de UTM/clique nem
atribuição multi-touque. O que existe (registro de comissão, origem por
empreendimento) está documentado em
`docs/product/REVENUE_AND_ATTRIBUTION.md`; o que não existe (atribuição
fina, pagamento/cobrança real) está listado ali como lacuna, não como
funcionalidade.

## O que foi corrigido durante o Marco F (não é mais lacuna)

Para contraste — itens que *eram* lacunas reais e foram corrigidos nesta
fase, não apenas documentados:

- `docker-compose.coolify.yml` sem serviço `worker`/`REDIS_URL`/`INTERNAL_API_KEY` (F1).
- `/health/ready` não verificava Redis (F1).
- CI publicava imagem sem rodar `typecheck lint test build` antes (F1).
- Zero auditoria de ações privilegiadas (F2).
- Zero fluxo LGPD de exportação/exclusão self-service (F3).
- Zero suíte de teste persistida — só scripts descartáveis (F4).
- Contraste de cor insuficiente (WCAG AA) em tokens usados em dezenas de
  telas, e 3 casos de nome acessível não incluindo texto visível (F4,
  encontrado pela própria suíte nova).
- `audit_logs.actor_user_id` e `development_partner_access.user_id` sem
  índice, apesar de filtrados diretamente em caminhos reais (F6).
