# OpenAPI — VALORI MATCH API

O documento OpenAPI é gerado em runtime pelo `SwaggerModule` (ver
`apps/api/src/main.ts`) a partir dos controllers e DTOs reais — nunca escrito
à mão, então nunca diverge das rotas de verdade.

## Ver interativamente

Com a API rodando localmente (`pnpm dev` ou `pnpm --filter @spire/api dev`),
a documentação interativa (Swagger UI) fica em:

```
http://localhost:4000/api/docs
```

## Exportar o JSON

```
node scripts/export-openapi.mjs
```

Busca `http://localhost:4000/api/docs-json` (endpoint que o `SwaggerModule`
expõe automaticamente ao lado da UI) e salva em `apps/api/openapi.json`.
Requer a API rodando. Reexecutar sempre que rotas/DTOs mudarem, antes de
commitar — o arquivo deve ficar em sincronia com o código.

## Superfície da API hoje

Snapshot real (`apps/api/openapi.json`, gerado nesta sessão): **110 rotas**,
**131 operações** (uma rota pode responder a mais de um verbo HTTP).
Autenticação via cookie de sessão (`spire_session`, `addCookieAuth` no
documento). Por recurso:

| Recurso | Operações | Recurso | Operações |
|---|---|---|---|
| `owner-leads` | 8 | `leads` | 7 |
| `properties` | 7 | `auth` | 7 |
| `notifications` | 7 | `campaigns` | 6 |
| `settings` | 6 | `developments` | 6 |
| `admin-users` | 6 | `me` | 5 |
| `brokers` | 5 | `visits` | 5 |
| `market-indicators` | 5 | `partners` | 5 |
| `radars` | 4 | `reports` | 4 |
| `units` | 4 | `private-market` | 4 |
| `development-partner-access` | 4 | `automations` | 3 |
| `matches` | 3 | `favorites` | 3 |
| `commissions` | 3 | `proposals` | 2 |
| `contacts` | 2 | `health` | 2 |
| `data-subject-requests` | 2 | `interactions` | 1 |
| `ai` | 1 | `tours` | 1 |
| `audit-logs` | 1 | `demand-match` | 1 |
| `integrations-status` | 1 | | |

## O que falta

- O JSON exportado é um snapshot manual, não gerado automaticamente em CI —
  se alguém esquecer de reexecutar o script após mudar uma rota, o arquivo
  fica defasado até a próxima exportação manual. Não há checagem automática
  de divergência entre `openapi.json` e o código real (ver
  `docs/qa/GAPS_REPORT.md`).
- Os DTOs usam validação Zod (`@spire/contracts` + `ZodValidationPipe`), não
  decorators `@ApiProperty`/`@ApiBody` do NestJS/Swagger — então a maioria
  das rotas aparece no documento **sem schema de request/response
  detalhado** (verificado: `GET /properties/nearby` no `openapi.json` exporta
  `parameters: []` e `responses.200` só com `description: ""`, sem `content`
  nem `schema`). O documento é útil para navegar rotas, verbos e
  autenticação, mas não substitui ler o schema Zod real em
  `packages/contracts/src/*.ts` para saber a forma exata de um payload, e
  não serve para gerar um client tipado automaticamente a partir do OpenAPI.
