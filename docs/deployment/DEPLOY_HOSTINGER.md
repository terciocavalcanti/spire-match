# Guia de deploy — SPIRE MATCH na Hostinger VPS (KVM 2)

> Sua VPS já tem o **Coolify** instalado (ex: template "Coolify" da
> Hostinger)? Use [DEPLOY_COOLIFY.md](DEPLOY_COOLIFY.md) em vez deste — é
> mais simples, o Coolify já cuida do proxy/HTTPS e do build a partir do Git.
> Este guia aqui é para uma VPS "crua", só com Ubuntu.

Este guia assume que você **nunca configurou um servidor Linux antes**. Siga
os passos na ordem. Cada comando é para copiar e colar — não precisa entender
tudo de primeira, só ir executando.

No fim você vai ter: a API, o PWA do comprador e o painel comercial rodando
na sua VPS, com HTTPS automático, atrás dos domínios que você escolher.

---

## Visão geral do que vai acontecer

1. Você cria a VPS na Hostinger e aponta domínios para ela.
2. Você instala o Docker na VPS (um comando).
3. Você clona o repositório na VPS e cria um arquivo `.env` com as senhas de produção.
4. Você conecta o GitHub ao Docker da VPS (GitHub Actions) para que, a cada vez que o Claude Code enviar código para a branch `main`, as imagens sejam construídas e enviadas automaticamente para a VPS.
5. Você sobe a stack (`docker compose up -d`) e o Caddy emite HTTPS sozinho.

Depois do primeiro deploy, **novas atualizações de código já sobem automaticamente** sempre que houver um `git push` para `main` — você não precisa repetir os passos manuais.

---

## Parte 1 — Criar e preparar a VPS

### 1.1. Contratar a VPS

Na Hostinger, contrate o plano **VPS KVM 2**, escolhendo a imagem de sistema
**Ubuntu 24.04 LTS**. Ao final da contratação, a Hostinger te dá:
- Um **endereço IP** (ex: `123.45.67.89`) — guarde-o.
- Uma senha de root (ou você define uma).

### 1.2. Apontar os domínios

Você vai precisar de **3 subdomínios** apontando para o IP da VPS. Se seu
domínio é `seudominio.com.br`, sugiro:
- `app.seudominio.com.br` → o PWA do comprador
- `admin.seudominio.com.br` → o painel comercial
- `api.seudominio.com.br` → a API

No painel de DNS do seu domínio (Hostinger, Registro.br, Cloudflare, etc.),
crie **3 registros do tipo A**, todos apontando para o IP da VPS:

| Tipo | Nome    | Valor (IP da VPS) |
|------|---------|--------------------|
| A    | app     | 123.45.67.89       |
| A    | admin   | 123.45.67.89       |
| A    | api     | 123.45.67.89       |

Isso pode levar de alguns minutos a algumas horas para propagar. Você pode
checar se já propagou rodando, no seu computador:
```
nslookup app.seudominio.com.br
```
Se devolver o IP da VPS, propagou.

### 1.3. Acessar a VPS via SSH

No seu computador (PowerShell ou terminal):
```
ssh root@123.45.67.89
```
Digite a senha quando pedir. Agora você está "dentro" da VPS — todo comando
a seguir nesta Parte 1 e na Parte 2 é executado **dentro dessa conexão SSH**.

### 1.4. Instalar o Docker

Copie e cole este bloco inteiro (é o instalador oficial do Docker):
```bash
curl -fsSL https://get.docker.com | sh
```
Aguarde terminar (1–2 minutos).

### 1.5. Criar um usuário próprio (recomendado, mais seguro que usar root)

```bash
adduser spire
usermod -aG docker spire
usermod -aG sudo spire
```
Siga as perguntas (defina uma senha para esse usuário). A partir daqui, saia
do root e entre com o novo usuário:
```bash
exit
ssh spire@123.45.67.89
```

---

## Parte 2 — Colocar o código na VPS

### 2.1. Clonar o repositório

```bash
sudo mkdir -p /opt/spire-match
sudo chown spire:spire /opt/spire-match
git clone https://github.com/terciocavalcanti/spire-match.git /opt/spire-match
cd /opt/spire-match
```

### 2.2. Criar o arquivo de variáveis de ambiente de produção

```bash
cp .env.prod.example .env
nano .env
```
O `nano` é um editor de texto simples dentro do terminal. Ajuste pelo menos:

- `APP_DOMAIN`, `ADMIN_DOMAIN`, `API_DOMAIN` → os 3 domínios que você criou na Parte 1.1.
- `POSTGRES_PASSWORD` → troque por uma senha forte e só sua (ex: gere uma em https://1password.com/password-generator, ou rode `openssl rand -base64 24` na própria VPS).
- `DATABASE_URL` → troque a senha nela também, **igual à que você colocou em `POSTGRES_PASSWORD`**.
- `CORS_ALLOWED_ORIGINS` → `https://app.seudominio.com.br,https://admin.seudominio.com.br` (com os seus domínios reais).

As demais variáveis (MapTiler, SMTP, WhatsApp, LLM) podem ficar em branco por
agora — o produto funciona sem elas, só com os avisos de "pendência externa"
visíveis nas telas que dependem delas. Você preenche quando tiver cada
credencial.

Para salvar e saone no `nano`: `Ctrl+O`, Enter, depois `Ctrl+X`.

---

## Parte 3 — Conectar o GitHub à VPS (deploy automático)

Isso faz com que, toda vez que houver um `git push` para a branch `main`, o
GitHub construa as 3 imagens Docker e atualize sua VPS automaticamente —
você não vai precisar repetir isso manualmente depois.

### 3.1. Criar uma chave SSH exclusiva para o GitHub Actions

Ainda conectado na VPS como usuário `spire`:
```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy_key -N ""
cat ~/.ssh/github_deploy_key.pub >> ~/.ssh/authorized_keys
cat ~/.ssh/github_deploy_key
```
O último comando mostra a **chave privada** — copie o texto inteiro, incluindo
as linhas `-----BEGIN...` e `-----END...`. Você vai usá-lo no próximo passo.

### 3.2. Cadastrar os secrets no GitHub

No navegador, abra:
`https://github.com/terciocavalcanti/spire-match/settings/secrets/actions`

Clique em **"New repository secret"** e crie estes três, um por um:

| Nome          | Valor                                              |
|---------------|-----------------------------------------------------|
| `VPS_HOST`    | o IP da sua VPS (ex: `123.45.67.89`)                |
| `VPS_USER`    | `spire`                                              |
| `VPS_SSH_KEY` | a chave privada que você copiou no passo 3.1 (texto completo) |

### 3.3. (Opcional) Variáveis públicas do build do PWA/Painel

Em `.../settings/variables/actions`, crie (se quiser já deixar configurado):

| Nome | Valor |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://api.seudominio.com.br/api/v1` |
| `NEXT_PUBLIC_MAPTILER_API_KEY` | (deixe vazio até ter a chave do MapTiler) |

Sem isso, o PWA é construído apontando para `http://localhost:4000/api/v1`
por padrão — ou seja, **esse passo é obrigatório** para o PWA em produção
conseguir falar com a API real.

### 3.4. Permitir que o GitHub publique imagens no seu GHCR

Isso já funciona automaticamente com o `GITHUB_TOKEN` embutido no workflow —
nenhum cadastro extra é necessário. Só é preciso, **depois do primeiro
deploy funcionar**, tornar os 3 pacotes gerados públicos (ou a VPS precisa de
login), veja a Parte 4.4.

---

## Parte 4 — Primeiro deploy

### 4.1. Disparar o primeiro build

No seu computador, qualquer novo `git push` para a branch `main` do
repositório já dispara o workflow. Se você só acabou de configurar os
secrets e quer forçar um primeiro build sem esperar um novo commit, abra:
`https://github.com/terciocavalcanti/spire-match/actions/workflows/deploy.yml`
e clique em **"Run workflow"**.

### 4.2. Acompanhar

Na mesma página de Actions, clique na execução em andamento. Ela tem 2
etapas: `build-and-push` (constrói as 3 imagens, ~3–8 minutos) e `deploy`
(conecta na VPS e atualiza, ~30 segundos). Se a etapa `deploy` falhar com
erro de SSH, revise o passo 3.1–3.2.

### 4.3. Deixar as imagens do GHCR acessíveis para a VPS

Na primeira vez, o `docker compose pull` na VPS pode falhar porque os
pacotes recém-criados no GitHub Container Registry (GHCR) começam como
**privados**. Para cada um dos 3 pacotes:

1. Abra `https://github.com/terciocavalcanti?tab=packages`
2. Clique em `spire-match-api` (depois repita para `spire-match-web` e `spire-match-admin`)
3. "Package settings" → "Change visibility" → **Public**

(Alternativa mais "fechada": manter privado e fazer `docker login ghcr.io`
na VPS com um token seu — mais segura, porém com um passo manual extra. Para
o estágio atual do projeto, público é mais simples e as imagens não contêm
nenhum segredo, só código já público no repositório.)

### 4.4. Subir a stack na VPS (primeira vez, manual)

Conecte de novo via SSH (`ssh spire@123.45.67.89`) e rode:
```bash
cd /opt/spire-match
docker compose --env-file .env -f infrastructure/docker/docker-compose.prod.yml pull
docker compose --env-file .env -f infrastructure/docker/docker-compose.prod.yml up -d
```

Aguarde ~1 minuto e confira se tudo subiu saudável:
```bash
docker compose --env-file .env -f infrastructure/docker/docker-compose.prod.yml ps
```
Você deve ver `postgres`, `redis`, `api`, `web`, `admin` e `caddy` com status
`running` (e `healthy` nos que têm healthcheck).

### 4.5. Conferir o HTTPS

Abra no navegador `https://app.seudominio.com.br`. O Caddy emite o
certificado HTTPS automaticamente na primeira requisição — se os DNS já
propagaram (passo 1.2), deve funcionar sem nenhum passo extra. Repita para
`https://admin.seudominio.com.br` e teste a API em
`https://api.seudominio.com.br/api/v1/health/live` (deve responder
`{"status":"ok"}`).

Se der erro de certificado, normalmente é porque o DNS ainda não propagou —
espere mais um pouco e recarregue.

---

## Depois disso: o dia a dia

- **Nova versão do código**: basta o Claude Code (ou você) fazer
  `git push` para `main`. O GitHub Actions builda e atualiza a VPS sozinho
  em poucos minutos — nenhum passo manual necessário.
- **Mudou algo no `.env` (nova credencial, domínio, etc.)**: isso é manual,
  edite direto na VPS (`nano /opt/spire-match/.env`) e depois:
  ```bash
  cd /opt/spire-match
  docker compose --env-file .env -f infrastructure/docker/docker-compose.prod.yml up -d
  ```
- **Ver logs de um serviço** (ex: a API):
  ```bash
  docker compose --env-file .env -f infrastructure/docker/docker-compose.prod.yml logs -f api
  ```
- **Fazer backup do banco**:
  ```bash
  docker compose --env-file .env -f infrastructure/docker/docker-compose.prod.yml exec postgres \
    pg_dump -U spire spire_match > backup-$(date +%Y%m%d).sql
  ```

## Pendências externas (ativar quando tiver a credencial)

Preencher a variável correspondente no `.env` da VPS e repetir o passo 4.4
(`up -d`) é suficiente para ativar — nenhuma mudança de código é necessária:

| Variável | O que ativa |
|---|---|
| `MAPTILER_API_KEY` / `NEXT_PUBLIC_MAPTILER_API_KEY` (este via GitHub Actions "variables", passo 3.3) | Cartografia detalhada no Mapa Inteligente |
| `S3_*` | Upload de fotos de imóveis |
| `SMTP_URL` | E-mails transacionais reais (hoje vão para o Mailhog só em dev) |
| `WHATSAPP_CLOUD_API_TOKEN` / `WHATSAPP_PHONE_NUMBER_ID` | Notificações via WhatsApp |
| `LLM_PROVIDER_API_KEY` | AI Concierge com modelo de linguagem (hoje usa só o parser determinístico em pt-BR) |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Notificações push no navegador |

Até lá, cada uma dessas funcionalidades mostra um aviso explícito de
"pendência externa" no app em vez de simular dados — nunca é preciso "fingir"
que algo está ativo.
