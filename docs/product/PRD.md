# PRD — VALORI MATCH

**Status:** Marcos A–F implementados · documento reconstruído a partir de `PROMPT_MESTRE_ANTIGRAVITY.md` e do sistema real em produção neste repositório.

## Problema

Imobiliárias e incorporadoras têm carteira de imóveis e uma base de interessados, mas o cruzamento entre os dois é manual: um corretor precisa lembrar quais compradores combinam com qual imóvel, e um comprador vê centenas de anúncios sem saber por que algum seria mais adequado que outro. O resultado é captação de leads sem qualificação, atendimento genérico e perda de oportunidades de conversão.

## Promessa do produto

"O imóvel certo, no lugar certo, na hora certa." VALORI MATCH cruza o perfil do comprador, a carteira de imóveis e os eventos de interesse (favoritos, visitas, swipes) para produzir uma compatibilidade explicável (Match Score 0–100, ver `docs/product/BUSINESS_RULES.md`), identificar oportunidades, convertê-las em visitas/propostas e melhorar a captação de imóveis.

## Personas

| Persona | Papel no RBAC (`packages/contracts/src/common.ts`) | Usa |
|---|---|---|
| Visitante não autenticado | `VISITOR` | Home pública (`/`), catálogo (`/explorar`), detalhe de imóvel sem ações privadas |
| Comprador | `BUYER` | PWA completa — Matches, swipe, favoritos, comparação, agendamento, perfil/LGPD |
| Proprietário interessado em captar | `OWNER` (lead qualificado, não necessariamente usuário logado) | `/tenho-um-imovel`, fluxo de captação (owner-leads) |
| Corretor | `BROKER` | Painel comercial — leads, agenda, kanban de captações |
| Gestor comercial | `SALES_MANAGER` | Painel comercial completo + relatórios/financeiro |
| Administrador / Super admin | `ADMIN` / `SUPER_ADMIN` | Todos os módulos admin, configurações, auditoria, LGPD |
| Parceiro de incorporadora | `DEVELOPER_PARTNER` | Acesso restrito e somente-leitura a métricas agregadas do próprio empreendimento (`/admin/incorporadoras`) |

## Proposta de valor central: o Match Engine

Score 0–100 por par comprador-imóvel, puro e determinístico (`packages/domain/src/match/score.ts`), com pesos configuráveis (orçamento 25%, bairro 20%, proximidade 15% só quando há localização, área 10%, quartos/características 10%, finalidade 5%, pagamento 5%, sinais de preferência 10%), critérios eliminatórios reais (imóvel indisponível, incompatibilidade marcada pelo comprador) e motivos explicáveis por código (`BUDGET_FIT`, `PREFERRED_AREA`, `NEARBY`, etc.). Patrocínio nunca altera o score. Ver `docs/product/BUSINESS_RULES.md` para a regra completa.

## Escopo — o que está em produção (v1)

- PWA do comprador: as 24 telas da matriz obrigatória (`docs/product/SCREEN_MATRIX_24.md`), mais telas adicionais (Pulse/mercado, Decide, Club/parceiros, captação de proprietário, Private Market).
- Painel comercial: CRM de leads e captações, kanban, agenda, campanhas, relatórios/financeiro, auditoria e privacidade (LGPD).
- API REST versionada (`/api/v1`) com ~110 rotas documentadas (`apps/api/openapi.json`).
- Autenticação por sessão própria (Argon2id, cookie httpOnly), RBAC por papel.
- Notificações in-app e Web Push (ver `docs/operations/NOTIFICATION_POLICY.md`).
- LGPD self-service: exportação instantânea de dados próprios, solicitação de exclusão com aprovação do time comercial, trilha de auditoria de ações privilegiadas (Marco F2/F3).
- Suíte de testes e2e persistida (Playwright), teste de carga honesto local, documentação completa (Marco F4/F5/F6).

## Fora de escopo nesta entrega (ver `docs/qa/GAPS_REPORT.md` para a lista completa)

- Login social (Google/Apple OIDC) — adapters previstos na arquitetura, não configurados por falta de credenciais reais.
- Integração oficial WhatsApp Business Platform — adapter e templates documentados (`docs/operations/WHATSAPP_TEMPLATES.md`), sem credenciais de produção.
- App mobile nativo — contratos/SDK preparados (`packages/contracts`, `packages/api-client`) para não exigir reescrita futura, mas nenhum app React Native foi construído.
- Atribuição multi-touch de campanha por lead individual (first-touch/last-touch/influenced) — hoje a atribuição é por empreendimento, não por lead (ver `docs/product/REVENUE_AND_ATTRIBUTION.md`).
- Purga automática de dados por prazo de retenção — o prazo é configurável e exibido, mas nenhum job remove dados automaticamente ao vencer.
- Pagamento/cobrança automática de incorporadoras — campanhas e comissões são registradas, não existe gateway de cobrança.
