# Backup e restore — VALORI MATCH

Cobre o banco Postgres, que é o único dado de estado real desta aplicação
hoje (ver nota sobre fotos de imóveis no final). Os comandos abaixo valem
para os dois caminhos de deploy — o nome do serviço Compose é `postgres` em
ambos (`infrastructure/docker/docker-compose.prod.yml` e
`docker-compose.coolify.yml`).

## Estado atual: backup é manual, não automatizado

Não existe cron, script agendado nem integração com storage externo para
backup neste repositório — isso é uma lacuna real, não uma omissão deste
documento (ver [docs/qa/GAPS_REPORT.md](../qa/GAPS_REPORT.md)). O
procedimento abaixo precisa ser executado manualmente ou agendado por fora
(ex.: cron no próprio host da VPS chamando o comando de backup).

## O que fazer backup

- **Postgres** (`spire_postgres_data`, volume Docker): todo o estado da
  aplicação — usuários, imóveis, leads, auditoria, configurações. É o único
  alvo deste documento.
- **Redis** (`spire_redis_data`): fila de jobs em trânsito (BullMQ) e cache.
  Não precisa de backup — é seguro perder; jobs pendentes de recálculo de
  Match/automação são reenfileirados pelas próprias rotinas periódicas do
  `worker`, nunca é a fonte de verdade de nenhum dado.
- **Fotos de imóveis / uploads**: se `S3_*` (ver `.env`) estiver configurado,
  os arquivos ficam no bucket S3-compatível, não no Postgres nem em volume
  local — faça backup pelo mecanismo do próprio provedor de storage (fora do
  escopo deste documento). Se `S3_*` estiver vazio, a feature de upload fica
  marcada como pendência externa (ver `DEPLOY_COOLIFY.md`/`DEPLOY_HOSTINGER.md`)
  e não há arquivo nenhum para gerenciar.

## Backup (rota manual Hostinger — `docker-compose.prod.yml`)

```bash
cd /opt/spire-match
docker compose --env-file .env -f infrastructure/docker/docker-compose.prod.yml \
  exec postgres pg_dump -U spire spire_match > backup-$(date +%Y%m%d-%H%M).sql
```

Comprimido (recomendado a partir de bancos maiores):

```bash
docker compose --env-file .env -f infrastructure/docker/docker-compose.prod.yml \
  exec postgres pg_dump -U spire -Fc spire_match > backup-$(date +%Y%m%d-%H%M).dump
```

`spire`/`spire_match` são os valores de `POSTGRES_USER`/`POSTGRES_DB` do
`.env.prod.example` — ajuste se você usou outros valores.

### Agendando (recomendado, ainda manual de configurar)

Adicione ao crontab do próprio host da VPS (fora de qualquer container),
por exemplo diariamente às 3h, guardando os últimos 7 backups:

```cron
0 3 * * * cd /opt/spire-match && docker compose --env-file .env -f infrastructure/docker/docker-compose.prod.yml exec -T postgres pg_dump -U spire -Fc spire_match > /opt/spire-match/backups/backup-$(date +\%Y\%m\%d).dump && find /opt/spire-match/backups -name 'backup-*.dump' -mtime +7 -delete
```

Copie os arquivos gerados para fora da própria VPS periodicamente (outro
servidor, storage de objeto, etc.) — um backup que só existe no mesmo disco
que pode falhar não protege contra a falha mais comum (disco/VPS perdida).

## Backup (rota Coolify — `docker-compose.coolify.yml`)

O Coolify não expõe `docker compose exec` direto por padrão na UI — use o
**Terminal** do serviço `postgres` na aba do recurso, ou SSH na VPS e rode:

```bash
docker exec <container_postgres> pg_dump -U spire spire_match > backup-$(date +%Y%m%d).sql
```

Ache o nome exato do container com `docker ps | grep postgres` (o Coolify
gera um nome com sufixo aleatório).

## Restore

1. Suba (ou garanta que já está rodando) o serviço `postgres` vazio ou a ser
   sobrescrito.
2. Caso o banco de destino já tenha dados que você quer descartar, pare os
   serviços que escrevem nele primeiro (`api`, `worker`) para evitar escrita
   concorrente durante o restore:
   ```bash
   docker compose --env-file .env -f infrastructure/docker/docker-compose.prod.yml stop api worker
   ```
3. Restore a partir de um dump texto (`pg_dump` sem `-Fc`):
   ```bash
   cat backup-20261031-0300.sql | docker compose --env-file .env \
     -f infrastructure/docker/docker-compose.prod.yml exec -T postgres \
     psql -U spire -d spire_match
   ```
   Ou a partir de um dump `-Fc` (formato customizado, permite restore
   paralelo e seletivo):
   ```bash
   docker compose --env-file .env -f infrastructure/docker/docker-compose.prod.yml \
     exec -T postgres pg_restore -U spire -d spire_match --clean --if-exists < backup-20261031-0300.dump
   ```
4. Religue `api` e `worker`:
   ```bash
   docker compose --env-file .env -f infrastructure/docker/docker-compose.prod.yml start api worker
   ```
5. Confirme com `GET https://api.seudominio.com.br/api/v1/health/ready` —
   deve responder `{"status":"ok","database":true,"redis":true}`.

### Restaurando em um volume novo (recuperação de desastre)

Se o volume `spire_postgres_data` foi perdido (VPS recriada do zero), basta
seguir o guia de deploy normal (`DEPLOY_HOSTINGER.md`/`DEPLOY_COOLIFY.md`)
até o Postgres subir vazio e saudável, aplicar as migrations
(`pnpm --filter @spire/api db:migrate`, ou deixe o próprio `api` rodar na
subida — ver `apps/api/src/database/migrate.ts`), e então seguir o passo de
restore acima.
