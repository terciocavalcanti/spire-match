# Guia de deploy — SPIRE MATCH via Coolify

Use este guia se sua VPS já tem o **Coolify** instalado (ex: template
"Coolify" da Hostinger). Se sua VPS é "crua" (só Ubuntu, sem Coolify), use
[DEPLOY_HOSTINGER.md](DEPLOY_HOSTINGER.md) em vez deste.

O Coolify já tem proxy reverso e HTTPS automático embutidos, então este
caminho **não precisa** do Caddy nem do GitHub Actions que aparecem no outro
guia — o próprio Coolify clona o repositório, builda os Dockerfiles e
gerencia os certificados.

O arquivo usado aqui é [`docker-compose.coolify.yml`](../../docker-compose.coolify.yml),
na raiz do repositório — diferente do `infrastructure/docker/docker-compose.prod.yml`
(esse é só para o caminho manual do outro guia).

---

## 0. Pré-requisito: DNS

Aponte 3 subdomínios para o IP da sua VPS (registros tipo A), como em
`DEPLOY_HOSTINGER.md`:

| Tipo | Nome | Valor |
|---|---|---|
| A | app | (IP da sua VPS) |
| A | admin | (IP da sua VPS) |
| A | api | (IP da sua VPS) |

## 1. Criar o recurso no Coolify

No painel do Coolify (a tela que você já está):

1. Vá em **Projects** → selecione um projeto (ou crie um, ex: "SPIRE MATCH") → **+ New Resource**.
2. Escolha **"Public Repository"** (o repositório `terciocavalcanti/spire-match` é público, não precisa conectar sua conta GitHub).
3. Cole a URL: `https://github.com/terciocavalcanti/spire-match`
4. Em **Build Pack**, escolha **Docker Compose**.
5. Configure:
   - **Base Directory**: `/`
   - **Docker Compose Location**: `docker-compose.coolify.yml`
6. Clique em algo como **"Continue"** / **"Save"** para o Coolify analisar o arquivo (ele vai listar os 5 serviços: `postgres`, `redis`, `api`, `web`, `admin`).

## 2. Preencher as variáveis de ambiente

Abra a aba **Environment Variables** deste recurso. O Coolify detecta
automaticamente todas as variáveis `${...}` do `docker-compose.coolify.yml` e
lista como campos editáveis. Preencha:

| Variável | Valor |
|---|---|
| `POSTGRES_USER` | `spire` |
| `POSTGRES_PASSWORD` | uma senha forte só sua (gere uma, ex: `openssl rand -base64 24`) |
| `POSTGRES_DB` | `spire_match` |
| `CORS_ALLOWED_ORIGINS` | `https://app.seudominio.com.br,https://admin.seudominio.com.br` |
| `NEXT_PUBLIC_API_URL` | `https://api.seudominio.com.br/api/v1` |
| `NEXT_PUBLIC_MAPTILER_API_KEY` | deixe vazio por agora |

As demais (`MAPTILER_API_KEY`, `S3_*`, `SMTP_URL`, `WHATSAPP_*`,
`LLM_PROVIDER_API_KEY`, `VAPID_*`) também aparecem — pode deixar todas em
branco por enquanto. Cada uma ativa uma integração externa só quando
preenchida (ver tabela no fim deste guia).

> **Importante**: `NEXT_PUBLIC_API_URL` e `NEXT_PUBLIC_MAPTILER_API_KEY` são
> usadas durante o **build** do PWA (ficam embutidas no código). Se você
> mudar alguma delas depois, precisa clicar em **Redeploy**, não só salvar.

## 3. Atribuir os domínios

Abra a aba **Domains** (ou "Network"/"FQDN", dependendo da versão). Para cada
serviço, adicione:

| Serviço | Porta interna | Domínio |
|---|---|---|
| `api` | `4000` | `https://api.seudominio.com.br` |
| `web` | `3000` | `https://app.seudominio.com.br` |
| `admin` | `3001` | `https://admin.seudominio.com.br` |

Não atribua domínio a `postgres` nem `redis` — eles devem continuar
acessíveis só internamente, nunca pela internet.

## 4. Deploy

Clique em **Deploy**. O Coolify vai: clonar o repositório, buildar as 3
imagens (api, web, admin — isso leva uns 3-6 minutos na primeira vez),
subir os 5 containers e emitir os certificados HTTPS automaticamente para os
3 domínios.

Acompanhe pelos **Deployment Logs**. Ao final, cada serviço deve aparecer
como "Running"/saudável.

> **Nota sobre o primeiríssimo deploy**: é normal e esperado que o container
> da `api` apareça como **"unhealthy" por até ~1 minuto** logo na primeira
> vez (o Postgres reinicia uma vez sozinho enquanto cria o banco do zero, e
> a API tenta se conectar um pouco antes disso terminar). Ele se recupera
> sozinho automaticamente — isso foi testado e confirmado antes deste guia
> ser escrito. Se depois de 2-3 minutos ainda estiver "unhealthy", aí sim
> vale investigar (clique no serviço → Logs).

## 5. Conferir

Abra:
- `https://app.seudominio.com.br` → PWA do comprador
- `https://admin.seudominio.com.br` → painel comercial
- `https://api.seudominio.com.br/api/v1/health/live` → deve responder `{"status":"ok"}`

## 6. Deploy automático a cada atualização (opcional)

Para que o Coolify redeploy sozinho a cada `git push` para `main`, conecte
sua conta GitHub em **Settings → Sources** no Coolify (ou configure o
webhook manualmente, nas instruções que o próprio Coolify mostra na aba
**Webhooks** do recurso). Sem isso, basta clicar **Redeploy** no Coolify
manualmente sempre que o Claude Code enviar uma atualização de código — o
Coolify sempre builda a partir do commit mais recente da branch `main`.

---

## Pendências externas (ativar quando tiver a credencial)

Preencha a variável correspondente na aba Environment Variables e clique
**Redeploy** — nenhuma mudança de código é necessária:

| Variável | O que ativa |
|---|---|
| `MAPTILER_API_KEY` / `NEXT_PUBLIC_MAPTILER_API_KEY` | Cartografia detalhada no Mapa Inteligente |
| `S3_*` | Upload de fotos de imóveis |
| `SMTP_URL` | E-mails transacionais reais |
| `WHATSAPP_CLOUD_API_TOKEN` / `WHATSAPP_PHONE_NUMBER_ID` | Notificações via WhatsApp |
| `LLM_PROVIDER_API_KEY` | AI Concierge com modelo de linguagem |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Notificações push no navegador |

Até lá, cada funcionalidade mostra um aviso explícito de "pendência externa"
no app em vez de simular dados.
