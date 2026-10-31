# RBAC — papéis e rotas

**Status:** Real · levantado por grep de `@Roles(...)` em todo `apps/api/src` (Marco F6)

## Como a autorização funciona de fato

- **Papéis existentes** (`packages/contracts/src/common.ts`): `BUYER`,
  `BROKER`, `SALES_MANAGER`, `ADMIN`, `SUPER_ADMIN`, `DEVELOPER_PARTNER`.
  Um usuário pode ter mais de um papel (`role_assignments`, N:N).
- **Dois guards compostos** (`apps/api/src/common/guards/roles.guard.ts`,
  `apps/api/src/auth/guards/session-auth.guard.ts`):
  - `SessionAuthGuard` resolve o cookie de sessão em `request.userId`. Sem
    cookie válido → `401 UNAUTHENTICATED`/`SESSION_EXPIRED`.
  - `RolesGuard` **só bloqueia se a rota tiver `@Roles(...)`**. Sem esse
    decorator, RBAC é opt-in — qualquer usuário autenticado passa. Ele
    sempre roda depois de `SessionAuthGuard` (`@UseGuards(SessionAuthGuard, RolesGuard)`).
- Cada controller define sua própria constante de papéis (`CRM_ROLES`,
  `ADMIN_CATALOG_ROLES`, `FINANCE_ROLES`, `SETTINGS_ROLES`, ...). **O nome
  é reaproveitado entre arquivos, mas o conteúdo não é sempre igual** — por
  exemplo `CRM_ROLES` em `leads.controller.ts` inclui `BROKER`, mas em
  `development-partner-access.controller.ts` não. A tabela abaixo usa os
  papéis reais de cada rota, não o nome da constante.

## Rotas por grupo de papel

### ADMIN, SUPER_ADMIN (exclusivo)

| Rota | Controller |
|---|---|
| `* /admin-users` | `admin-users.controller.ts` (`USER_MANAGEMENT_ROLES`) |
| `* /audit-logs` | `audit-log.controller.ts` (`AUDIT_ROLES`) |
| `* /settings` | `settings.controller.ts` (`SETTINGS_ROLES`) |
| `* /data-subject-requests` (fila admin de exclusão/exportação) | `data-subject-requests.controller.ts` (`PRIVACY_ROLES`) |
| `* /integrations-status` | `integrations-status.controller.ts` |

### ADMIN, SUPER_ADMIN, SALES_MANAGER ("catálogo"/"CRM" sem corretor)

| Rota | Controller |
|---|---|
| `POST/PATCH /properties/admin*`, `GET /properties/admin` | `properties.controller.ts` (`ADMIN_CATALOG_ROLES`) |
| `POST/PATCH /brokers` (GET é público — ver abaixo) | `brokers.controller.ts` |
| `* /developments`, `* /units` | `developments.controller.ts`, `units.controller.ts` |
| `* /campaigns` | `campaigns.controller.ts` |
| `* /demand-match` | `demand-match.controller.ts` |
| `* /market-indicators` | `market-indicators.controller.ts` |
| `* /partners` | `partners.controller.ts` |
| `* /private-market` (fila admin — `requestContact` do comprador é self-service, ver abaixo) | `private-market.controller.ts` |
| `* /owner-leads` (exceto `create`/`listMine`, self-service do proprietário) | `owner-leads.controller.ts` |
| `GET/PATCH /development-partner-access` (conceder/revogar/listar) | `development-partner-access.controller.ts` |
| `* /automations`, `* /commissions`, `* /reports` | `automations.controller.ts`, `commissions.controller.ts`, `reports.controller.ts` (`FINANCE_ROLES`, mesmo conjunto de papéis) |

### ADMIN, SUPER_ADMIN, SALES_MANAGER, BROKER

| Rota | Controller |
|---|---|
| `* /leads` (listagem/funil/overview/estágio do CRM) | `leads.controller.ts` (`CRM_ROLES` — o único `CRM_ROLES` que inclui `BROKER`) |
| `PATCH /visits/:id/confirm` (ou equivalente de time comercial) | `visits.controller.ts` (rota inline, `mine`/`schedule`/`cancel` são self-service) |

### DEVELOPER_PARTNER (exclusivo)

| Rota | Controller |
|---|---|
| `GET /development-partner-access/me` (ou equivalente — acesso aos próprios empreendimentos vinculados) | `development-partner-access.controller.ts` |

### Self-service — qualquer usuário autenticado, sobre os próprios dados

Guard é só `SessionAuthGuard` (sem `RolesGuard`/`@Roles`) — o controle de
acesso é por `userId` da sessão, não por papel:

- `GET/PATCH /me/preferences` (`buyer-profile.controller.ts`)
- `* /favorites`, `* /interactions`, `* /contacts`, `* /proposals`, `* /tours`
- `GET /matches`, `GET /matches/:propertyId` (qualquer autenticado, não só `BUYER`)
- `GET/POST /notifications*` (lista, contagem não lida, marcar lido, push)
- `* /radars` (radares de busca do próprio comprador)
- `POST/GET /me/data-requests` (exportar/solicitar exclusão dos próprios dados)
- `POST /owner-leads`, `GET /owner-leads/mine` (captação do próprio proprietário)
- `POST /private-market/:offerId/contact` (comprador solicita contato)
- `GET/POST/PATCH/DELETE /auth/*` relevantes à própria conta (`logout`, `me`, `password` — ver abaixo)

### Público — sem autenticação

- `POST /auth/register`, `POST /auth/login`, `POST /auth/forgot-password`,
  `POST /auth/reset-password`, `POST /auth/verify-email` (todos com
  `@Throttle`, ver `docs/security/THREAT_MODEL.md`).
- `GET /properties`, `GET /properties/:slug`, `GET /properties/nearby`,
  `GET /properties/by-id/:id` — catálogo público de imóveis.
- `GET /brokers`, `GET /brokers/:id`, `GET /brokers/by-property/:propertyId`
  — nome/foto do consultor, informação já pública nas telas de imóvel.
- `GET /health`, `GET /health/ready` — health checks de infraestrutura.
- `POST /ai/search` — busca conversacional; **não exige login**, só
  `@Throttle({ limit: 20, ttl: 60_000 })` por IP. Ver lacuna em
  `THREAT_MODEL.md` (chama um provedor de IA externo sem exigir conta).
- `GET /api/docs`, `GET /api/docs-json` — Swagger UI/JSON, expõe o
  shape completo da API (rotas, DTOs) publicamente. Não expõe segredos,
  mas é reconhecimento de superfície de ataque grátis — ver `THREAT_MODEL.md`.

### Canal interno (não é RBAC de usuário)

`* /internal/*` (`internal.controller.ts`) é protegido por `InternalGuard`
— compara o header `x-internal-key` com `INTERNAL_API_KEY` do ambiente, não
por sessão/papel. Chamado só pelo `apps/worker` (recálculo de match,
varredura de radares, automações). Nunca exposto ao navegador.

## Papéis sem nenhuma rota dedicada hoje

`BUYER` não aparece em nenhum `@Roles(...)` — é o papel padrão do
comprador, e toda a experiência dele é coberta pelas rotas "self-service"
acima (sem checagem de papel, só de `userId`). Não é uma lacuna: é a
intenção do design (RBAC opt-in protege ações privilegiadas, não a
navegação normal do comprador).
