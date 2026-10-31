# Jornadas de usuário reais

Seis jornadas ponta a ponta que funcionam hoje no sistema implementado, com as rotas/endpoints reais exercitados em cada etapa. Todas foram verificadas manualmente contra a API/banco real durante os Marcos B–F (não são aspiracionais).

## 1. Comprador descobre e favorita um imóvel

1. Login em `/entrar` (`POST /api/v1/auth/login`).
2. `/inicio` mostra Matches reais calculados pelo Match Engine (`GET /api/v1/matches`) com score e motivos.
3. `/explorar` permite busca/filtro (`GET /api/v1/properties`).
4. Abre o detalhe em `/imoveis/[slug]` — galeria, preço, motivos de Match, botões de contato/agendar.
5. Toca no coração do card ou do detalhe — `POST /api/v1/favorites` / `DELETE /api/v1/favorites/:propertyId` — estado reflete em `/favoritos` imediatamente.

## 2. Comprador recebe alerta de proximidade e decide por swipe

1. `/matches/perto` — se o navegador concedeu geolocalização, mostra distância real (`GEOLOCATION_API`); se negada, mostra alerta contextual sem inventar proximidade (`distanceMeters: null` é um valor legítimo, não um erro).
2. `/matches/descobrir` — swipe (ou botões equivalentes) para Descartar/Salvar/Tenho interesse, registrando `POST /api/v1/interactions` com o tipo correspondente (`LIKE`/`DISLIKE`/`FAVORITE`).

## 3. Proprietário capta um imóvel até o circuito autorizado e um comprador pede contato

Jornada completa de ponta a ponta (ver `docs/product/BUSINESS_RULES.md` para o pipeline completo):

1. Proprietário envia o formulário em `/tenho-um-imovel` → `POST /api/v1/owner-leads` (stage inicial `NOVO`).
2. Corretor/admin triagem em `/admin/captacoes` (kanban) → `PATCH /api/v1/owner-leads/:id/stage` para `TRIAGEM` e depois `APROVADO`.
3. Corretor publica o imóvel → `POST /api/v1/owner-leads/:id/publish` — cria o registro real em `properties` e muda o owner-lead para `CONVERTIDO`.
4. Se o proprietário optou por Private Market (off-market), o admin verifica a oferta → `PATCH /api/v1/private-market/:id/verify` — só então ela entra no circuito autorizado e passa a ser visível em `/mercado-privado` para compradores elegíveis.
5. Um comprador autenticado vê a oferta e pede contato → `POST /api/v1/private-market/:id/request-contact`.
6. O pedido gera um lead real no CRM, visível em `/admin/leads` com `sourcePropertyId` apontando para o imóvel — o corretor assume o atendimento a partir daí (jornada 5).

## 4. LGPD — exportação e exclusão de dados (Marco F3)

1. Em `/perfil`, o comprador toca em "Baixar meus dados" → `POST /api/v1/me/data-requests` com `type=EXPORTACAO` — resposta instantânea com um JSON real de tudo que o sistema guarda sobre ele (perfil, preferências, favoritos, visitas, propostas, leads, consentimentos).
2. Para excluir a conta, toca em "Solicitar exclusão" (modal de confirmação explica a irreversibilidade) → `POST /api/v1/me/data-requests` com `type=EXCLUSAO`, que cria uma solicitação `PENDENTE` — não é instantânea de propósito.
3. Um admin revisa a fila em `/admin/privacidade` → `PATCH /api/v1/data-subject-requests/:id` com `REJEITADO` (motivo obrigatório) ou `CONCLUIDO`.
4. Em `CONCLUIDO`, o usuário é anonimizado (nome/e-mail/avatar), `status` vira `DELETED`, todas as sessões são revogadas e o login passa a ser bloqueado automaticamente — sem código novo de bloqueio, reaproveitando a mesma regra que já impede login de usuários `SUSPENDED`.
5. Toda a ação fica registrada em `/admin/auditoria` (`audit_logs`).

## 5. Corretor trabalha um lead no funil até Ganho

1. Lead chega em `/admin/leads` com estágio `NOVO` (criado por favorito/contato/formulário, com `sourcePropertyId` preenchido).
2. Corretor assume/avança o estágio em `/admin/leads/[id]` ou no kanban de `/admin/funil`: `NOVO → QUALIFICANDO → INTERESSE → VISITA_AGENDADA → VISITADO → PROPOSTA → NEGOCIACAO → GANHO` (ou `PERDIDO` com motivo), via `PATCH /api/v1/leads/:id/stage`.
3. Ao longo do caminho, agenda visitas em `/admin/agenda` (ou o comprador agenda em `/visitas/agendar`), registra notas e tarefas no detalhe do lead.
4. Ao marcar `GANHO` com `wonAmount`, o sistema cria automaticamente um registro de comissão (`CommissionsService.createForWonLead`, status inicial `PREVISTO`) — visível em `/admin/financeiro`, sem misturar VGV com comissão.
5. Gestor acompanha o funil e a receita prevista/recebida em `/admin/relatorios` e `/admin/financeiro`.

## 6. Agendamento de visita sem conflito

1. A partir do detalhe do imóvel ou do atendimento (`/atendimento/[propertyId]`), o comprador acessa `/visitas/agendar?imovel=...`.
2. Escolhe um horário dentro da disponibilidade real do corretor responsável (`visits`/`brokers`) — a reserva é atômica: dois compradores não conseguem confirmar o mesmo slot.
3. Visita é criada com status `REQUESTED`/`CONFIRMED`; aparece em `/minhas-visitas` para o comprador e em `/admin/agenda` para o time comercial.
4. Reagendamento/cancelamento atualizam o mesmo registro, com notificação para as partes envolvidas.
