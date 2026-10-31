# Modelo de ameaças

**Status:** Real · Marco F6 — cada mitigação cita o mecanismo/arquivo real; cada lacuna foi verificada, não suposta.

## Ativos

- Credenciais e sessões de usuários (compradores, corretores, admins).
- Dados pessoais de titulares (ver `docs/security/LGPD_DATA_MAP.md`).
- Dados comerciais sensíveis (leads, comissões, propostas, captações de
  imóveis privados/exclusivos).
- Disponibilidade da API e do worker (fila BullMQ/Redis).
- Orçamento de provedores externos de terceiros (IA, WhatsApp, e-mail,
  mapas) — custo por chamada é um ativo financeiro, não só segurança.

## Fronteiras de confiança

```
Navegador (não confiável)
   │ HTTPS, cookie httpOnly
   ▼
apps/web, apps/admin (Next.js) ── mesma rede do apps/api, origem permitida
   │ fetch com cookie de sessão
   ▼
apps/api (Nest) ── fronteira principal: todo guard/validação vive aqui
   │ x-internal-key (segredo compartilhado)
   ▼
apps/worker ── nunca exposto à internet, só fala com apps/api e Redis
   │
   ▼
Postgres / Redis ── só acessíveis dentro da rede dos containers
```

## Mitigações já implementadas (com mecanismo real)

| Ameaça | Mitigação | Onde |
|---|---|---|
| Senha em texto puro / crackeável | Hash Argon2id | `apps/api/src/auth/password.service.ts` |
| Roubo de sessão via XSS lendo cookie | Cookie `httpOnly` | `apps/api/src/auth/auth.controller.ts:34` |
| Cookie interceptado em rede não criptografada | `secure: SESSION_COOKIE_SECURE` — **depende de env, ver lacuna** | idem |
| CSRF em rota mutável autenticada por cookie | `sameSite: "lax"` no cookie **+** `OriginGuard` (valida header `Origin` contra allowlist em todo `POST/PUT/PATCH/DELETE`) | `auth.controller.ts:36`, `common/guards/origin.guard.ts` |
| Clickjacking, sniffing de MIME, outros headers básicos | `helmet()` global | `main.ts:18` |
| CORS permissivo | `enableCors({ origin: CORS_ALLOWED_ORIGINS, credentials: true })` — allowlist explícita, não `*` | `main.ts:20-23` |
| Força bruta / abuso em rotas sensíveis | `@Throttle` por rota: login 10/60s, registro/forgot-password/reset-password 5/60s, change-password 5/60s, verify-email 10/60s, busca por IA 20/60s | `auth.controller.ts`, `ai-search.controller.ts` |
| Abuso genérico de qualquer rota | `ThrottlerGuard` global, 120 req/60s por IP+rota (`APP_GUARD`) | `app.module.ts:47-48,87` — **confirmado neste marco**: o teste de carga (F5) bateu nesse limite ao disparar 200 req/endpoint e recebeu 429 em exatamente 80 (40%), confirmando que o guard funciona como projetado |
| Vazamento de stack trace/erro interno ao cliente | `HttpExceptionFilter` global — erro não tratado retorna só `INTERNAL_ERROR` + `requestId` de correlação; stack vai só para `console.error` do servidor | `common/filters/http-exception.filter.ts` |
| Escalonamento de papel / acesso indevido a rota privilegiada | RBAC opt-in (`@Roles` + `RolesGuard`), checado contra `role_assignments` no banco a cada requisição (não confia em claim do token) | `common/guards/roles.guard.ts` — ver matriz completa em `docs/security/RBAC.md` |
| Worker comprometido acessando rotas de usuário | `/internal/*` isolado por segredo compartilhado (`INTERNAL_API_KEY`), nunca por sessão; `@ApiExcludeController()` tira do Swagger público | `common/guards/internal.guard.ts`, `internal/internal.controller.ts` |
| Exclusão acidental/sem registro de titular de dados | Exclusão LGPD exige ação explícita de ADMIN/SUPER_ADMIN sobre uma solicitação `PENDENTE`, nunca automática; toda resolução gera `audit_logs` | `data-subject-requests.service.ts:132-180` |
| Ação privilegiada sem rastro | `audit_logs` cobre mudança de papel/status de usuário, estágio de lead GANHO/PERDIDO, publicação de captação, verificação de oferta de Mercado Privado, mudanças de configuração, concessão/revogação de acesso de incorporadora, resolução de solicitação LGPD | `apps/api/src/audit/audit-log.service.ts` e chamadores — ver `docs/security/RBAC.md` |

## Lacunas reais (verificadas, não hipotéticas)

- **`SESSION_COOKIE_SECURE` tem default `"false"`** em `env.ts` e em
  `apps/api/.env.example`. Só é `true` em `.env.prod.example` e
  `docker-compose.coolify.yml` — ou seja, **depende de quem configurar o
  deploy lembrar de setar a variável**; não há um "secure por padrão" nem
  um check que impeça subir em produção sem isso. Já listado em
  `docs/deployment/PRODUCTION_LAUNCH_CHECKLIST.md` como item obrigatório
  de verificação manual antes do primeiro deploy.
- **Sem token CSRF dedicado (double-submit).** A defesa atual é
  `SameSite=Lax` + `OriginGuard`, suficiente contra CSRF cross-site clássico,
  mas o próprio código já comenta que um token dedicado "fica reservado...
  caso a superfície de ataque cresça" (`origin.guard.ts:13-14`) — decisão
  consciente, não descuido, mas é uma lacuna real se a superfície mudar
  (ex.: app mobile nativo que não manda `Origin`).
- **`POST /ai/search` é público e sem teto de custo além do throttle de
  IP** (20 req/60s). Chama um provedor de IA externo por requisição sem
  exigir conta — um IP rotativo poderia gerar custo real sem nunca se
  autenticar. Nenhum limite por conta/orçamento diário existe hoje.
- **Swagger (`/api/docs`, `/api/docs-json`) é público em qualquer
  ambiente**, incluindo produção — não há variável de ambiente que
  desative ou proteja por senha a documentação interativa. Não expõe
  segredos, mas facilita reconhecimento de superfície de ataque.
- **Sem MFA/2FA para nenhum papel**, incluindo `ADMIN`/`SUPER_ADMIN` — uma
  senha comprometida (phishing, reuso) é suficiente para acesso total.
- **Sem scanner automatizado de dependências** — não há Dependabot,
  CodeQL, `npm audit`/`pnpm audit` nem Snyk configurado em
  `.github/workflows/`. Vulnerabilidades em dependências só seriam
  descobertas manualmente.
- **Nenhum teste de penetração foi realizado** neste projeto — este
  documento é uma modelagem de ameaças por leitura de código, não o
  resultado de um pentest real.
- **Sem purga automática de retenção LGPD** — ver
  `docs/security/LGPD_DATA_MAP.md` (mesma lacuna, efeito de segurança:
  dados pessoais acumulam indefinidamente sem controle automático).
- **Rate limit é por IP, não por conta** — um atacante com múltiplos IPs
  (proxies rotativos) não é desacelerado pelo `ThrottlerGuard` do jeito que
  seria um único IP insistente.

Nenhuma lacuna acima foi inferida por suposição — cada uma foi confirmada
lendo o código/config real listado. Itens fora do código da aplicação
(hardening de SO do VPS, firewall do Hostinger/Coolify, WAF de borda) não
foram avaliados neste documento, que cobre a camada de aplicação.
