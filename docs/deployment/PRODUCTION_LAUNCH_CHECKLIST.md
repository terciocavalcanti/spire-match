# Checklist de lançamento em produção — VALORI MATCH

Específico deste repositório — não é um checklist genérico. Marque cada
item contra o estado real antes de considerar o lançamento pronto.

## 1. Variáveis de ambiente — valores reais, não os de exemplo

Nenhum destes pode ficar com o valor de `.env.prod.example`/`.env.example`:

- [ ] `POSTGRES_PASSWORD` — senha própria, gerada (`openssl rand -hex 24`),
      nunca a de desenvolvimento.
- [ ] `INTERNAL_API_KEY` — segredo compartilhado `api`↔`worker`, gerado
      (`openssl rand -hex 24`), nunca reaproveitado de dev.
- [ ] `SESSION_COOKIE_SECURE=true` (obrigatório em produção — cookies de
      sessão não devem viajar sem TLS).
- [ ] `CORS_ALLOWED_ORIGINS` apontando para os domínios reais de
      produção (`https://app...`, `https://admin...`), não `localhost`.
- [ ] `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY` — par próprio gerado para este
      deploy (nunca o par de desenvolvimento do repositório), ou push
      notification fica indisponível.

Pendências externas reais — **ok ficarem vazias no lançamento inicial**,
cada uma simplesmente mantém a funcionalidade correspondente marcada como
"pendência externa" no app em vez de simular dados (ver `apps/api/src/config/env.ts`):

- [ ] `MAPTILER_API_KEY` / `NEXT_PUBLIC_MAPTILER_API_KEY` (cartografia)
- [ ] `S3_ENDPOINT`/`S3_ACCESS_KEY_ID`/`S3_SECRET_ACCESS_KEY`/`S3_BUCKET` (upload de fotos)
- [ ] `SMTP_URL` (e-mail transacional real)
- [ ] `WHATSAPP_CLOUD_API_TOKEN`/`WHATSAPP_PHONE_NUMBER_ID` (ver `docs/operations/PROVIDER_CONFIGURATION.md`)
- [ ] `LLM_PROVIDER_API_KEY` (AI Concierge)

Decida explicitamente, não por omissão, quais destas o lançamento inicial
precisa — cada uma é uma decisão de produto, não só técnica.

## 2. CI/CD

- [ ] O job `test` do `.github/workflows/deploy.yml`
      (`pnpm turbo run typecheck lint test build`) está verde no commit que
      vai ser lançado — ele **bloqueia** `build-and-push`, então se chegou a
      gerar imagem, já passou.
- [ ] Os secrets `VPS_HOST`/`VPS_USER`/`VPS_SSH_KEY` estão configurados no
      GitHub (Settings → Secrets) se for usar o job `deploy` automático.

## 3. Infraestrutura

- [ ] DNS dos 3 domínios (`app`/`admin`/`api`) resolvendo para o IP da VPS
      de produção.
- [ ] TLS emitido com sucesso — Caddy (`infrastructure/caddy/Caddyfile.prod`)
      na rota manual, ou automático via Coolify na outra rota.
- [ ] `GET https://api.seudominio.com.br/api/v1/health/ready` responde
      `{"status":"ok","database":true,"redis":true}` — confirma Postgres E
      Redis, não só a API em si.
- [ ] Serviço `worker` rodando e saudável (`docker compose ps` ou aba do
      Coolify) — sem ele, recálculo de Match, varredura de radares e
      automações (notificações, lembretes) não executam, mesmo com `api`
      saudável. Ele não expõe porta HTTP, então só aparece quebrado nos
      logs/status do container, não em nenhum healthcheck HTTP externo.
- [ ] Backup inicial do banco feito manualmente e testado (restore em
      ambiente de teste) — ver `docs/deployment/BACKUP_RESTORE.md`. Não há
      automação de backup neste repositório; se o lançamento depende disso,
      é um item a resolver fora deste checklist, não algo já coberto.

## 4. Validação funcional antes de abrir para usuários reais

- [ ] `pnpm test:e2e` (suíte Playwright em `tests/e2e/`) verde contra a
      stack que vai para produção (local ou staging equivalente) — cobre
      login, Home com Match real, busca, favoritar, admin, acessibilidade
      (axe-core) e responsividade. Requer a stack rodando primeiro
      (`pnpm dev` ou equivalente) e os usuários demo seedados.
- [ ] `node scripts/load-test.mjs` rodado contra a stack de destino — não
      para prever capacidade de produção (os números são sempre de ambiente
      de teste, nunca extrapolados), mas para confirmar que os 3 endpoints
      medidos respondem sem erro sob concorrência moderada antes de expor a
      usuários reais.
- [ ] Login manual como comprador E como admin/corretor pelo navegador —
      os testes automatizados usam contas demo seedadas; confirme que o
      fluxo de cadastro real (sem seed) também funciona de ponta a ponta.

## Fora do escopo deste checklist

Itens deliberadamente não cobertos aqui — ver
[docs/qa/GAPS_REPORT.md](../qa/GAPS_REPORT.md) para o estado completo:

- Teste de penetração/auditoria de segurança externa.
- Teste de carga em escala de produção (o que este repo mede é só ambiente
  de desenvolvimento local, com um único processo de cada serviço).
- Teste em hardware físico real (o PWA só foi validado via emulação de
  viewport no Playwright).
- Purga automática de retenção de dados LGPD (o prazo é configurável e
  exibido, mas não há job de purga — ver `docs/security/LGPD_DATA_MAP.md`).
- Qualquer credencial externa listada no item 1 que ficar vazia no
  lançamento inicial.
