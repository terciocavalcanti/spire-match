# Mapa de dados pessoais (LGPD)

**Status:** Real · Marco F3/F6

Mapa dos dados pessoais efetivamente armazenados pela plataforma hoje, com
finalidade, base legal e quem pode acessar cada categoria. Levantado a
partir do schema real (`apps/api/src/database/schema/*.ts`), não de um
desenho aspiracional.

## Categorias de dado pessoal

| Categoria | Tabela(s) | Finalidade | Base legal | Quem acessa |
|---|---|---|---|---|
| Identificação e credenciais | `users` (name, email, password_hash, avatar_url) | Autenticação, identificação da conta | Execução de contrato | O próprio titular; ADMIN/SUPER_ADMIN (gestão de usuários) |
| Preferências de compra | `buyer_profiles` | Calcular Match Engine | Execução de contrato | O próprio titular; time comercial (via leads) |
| Favoritos e interações | `favorites`, `user_interactions` | Personalização, Match Engine | Execução de contrato / legítimo interesse | O próprio titular; sistema (cálculo de match) |
| Contatos com consultor | `contacts` | Atendimento comercial | Execução de contrato | O próprio titular; BROKER/time comercial atribuído |
| Visitas agendadas | `visits` | Agendamento, histórico comercial | Execução de contrato | O próprio titular; time comercial |
| Propostas | `proposals` | Negociação comercial | Execução de contrato | O próprio titular; time comercial |
| Lead comercial e timeline | `leads`, `lead_activities` | Gestão de funil de vendas | Legítimo interesse (operação comercial) | ADMIN, SUPER_ADMIN, SALES_MANAGER, BROKER |
| Captação como proprietário | `owner_leads`, `owner_lead_activities` | Triagem de imóveis ofertados pelo próprio titular | Execução de contrato / consentimento (`consent_capture_at`) | ADMIN, SUPER_ADMIN, SALES_MANAGER |
| Consentimento de Mercado Privado | `private_market_consents` | Registro legal do opt-in de exclusividade do proprietário | Consentimento | ADMIN, SUPER_ADMIN, SALES_MANAGER (via oferta) |
| Consentimentos gerais (LGPD) | `consents` | Histórico de consentimento (ex.: comunicações) | Consentimento | O próprio titular (export); **nenhum fluxo hoje grava nesta tabela — ver lacuna abaixo** |
| Sessões | `sessions` | Autenticação | Execução de contrato | Sistema; revogadas em exclusão/suspensão |
| Trilha de auditoria | `audit_logs` | Rastreabilidade de ações privilegiadas | Legítimo interesse / obrigação legal | ADMIN, SUPER_ADMIN |
| Solicitações de titular | `data_subject_requests` | Atender pedidos de exportação/exclusão | Obrigação legal (LGPD art. 18) | O próprio titular (as próprias); ADMIN/SUPER_ADMIN (todas) |

## Fluxo de exportação (self-service)

`POST /me/data-requests` com `type=EXPORTACAO` (`apps/api/src/data-subject-requests/data-subject-requests.service.ts:52-89`)
monta, na hora, um JSON real com: perfil, preferências de comprador,
favoritos, contatos, visitas, propostas, consentimentos, lead comercial e
timeline, captações como proprietário e suas atividades. É a mesma lista de
tabelas desta página — nada é inventado nem resumido. A solicitação já é
registrada como `CONCLUIDO` desde a criação (não precisa de aprovação para
o titular baixar os próprios dados). O botão "Baixar meus dados" em
`/perfil` (`apps/web/src/app/perfil/page.tsx`) consome essa rota.

## Fluxo de exclusão (confirmação do time comercial)

`POST /me/data-requests` com `type=EXCLUSAO` cria uma solicitação
`PENDENTE`. Só ADMIN/SUPER_ADMIN podem resolver via
`PATCH /data-subject-requests/:id`:

- **CONCLUIDO** → anonimiza `users.name`/`email`/`avatar_url`, seta
  `status=DELETED` e `deleted_at`, revoga todas as sessões
  (`SessionService.revokeAllForUser`). Linhas históricas (leads, visitas,
  propostas, comissões) **não são apagadas** — ficam vinculadas a um `id`
  não mais identificável, preservando obrigação contábil/legal.
- **REJEITADO** → exige motivo (`rejectionReason` obrigatório).

Ambas as resoluções geram uma linha em `audit_logs`
(`data_subject_request.deletion_confirmed` / `.deletion_rejected`).

## Retenção

`SettingsService.getDataRetentionDays()` expõe um valor configurável
(padrão documentado no código, ver `DEFAULT_DATA_RETENTION_DAYS` em
`apps/api/src/settings/settings.service.ts`), editável em
`/admin/configuracoes`.

**Lacuna real:** esse valor é **apenas informativo/exibido** — não existe
hoje nenhum job (cron, fila) que apague ou anonimize dados automaticamente
ao atingir o prazo. A única forma de exclusão é a solicitação manual
descrita acima. Isso é uma decisão deliberada deste marco (risco de apagar
dados em massa sem supervisão ficou fora do orçamento), não um bug — mas é
uma lacuna real e deve ser tratada como tal em qualquer avaliação de
conformidade. Ver `docs/qa/GAPS_REPORT.md`.

## Outra lacuna real: tabela `consents` sem gravação

A tabela genérica `consents` (consentimento de marketing/comunicações, por
propósito) existe no schema e **é lida** na exportação de dados do titular,
mas **nenhum código no projeto grava uma linha nela hoje** — não há tela de
captura de consentimento genérico (ex.: banner de cookies, opt-in de
comunicação) ligada a essa tabela. O único consentimento realmente
capturado e persistido no sistema é o de Mercado Privado
(`private_market_consents`, carimbado no momento em que o proprietário
marca o opt-in de exclusividade — ver `PrivateMarketService.createForOwnerLead`).
Se o produto expandir para captura de consentimento de marketing, essa é a
tabela e o ponto de integração a usar — hoje ela é só uma categoria
exportável, vazia em qualquer conta real.

## Páginas de política voltadas ao titular

- `apps/web/src/app/privacidade/page.tsx` — política de privacidade real
  (finalidades, bases legais, direitos do titular, contato).
- `apps/web/src/app/termos/page.tsx` — termos de uso reais.

Ambas substituíram texto-placeholder no Marco F3 e descrevem o
comportamento real do sistema (não um texto genérico de modelo jurídico).
