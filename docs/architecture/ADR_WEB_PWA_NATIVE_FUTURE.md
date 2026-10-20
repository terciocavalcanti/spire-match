# ADR — Arquitetura pronta para app React Native futuro

**Status:** Aceito · Marco A

## Contexto

O prompt mestre exige que o core (banco, API, regras de negócio) nunca
precise ser reescrito quando um app React Native for desenvolvido no futuro,
sem contudo construir esse app agora.

## Decisão

- **Contratos versionados** (`packages/contracts`): todo DTO trafegado pela
  API é um schema Zod único, consumido por `apps/api` (validação de entrada),
  `packages/api-client` (parsing de resposta) e, futuramente, pelo app RN.
- **SDK isomórfico** (`packages/api-client`): usa `fetch` global, sem
  dependência de DOM/Next — roda igualmente em React Native/Expo.
- **Domínio puro** (`packages/domain`): Match Engine e demais regras de
  negócio não têm I/O; podem ser reaproveitadas por qualquer client ou
  rodar como lib compartilhada, sem reescrita.
- **Autenticação interoperável**: sessões via cookie httpOnly para web
  (`apps/web`, `apps/admin`); o backend já expõe os mesmos endpoints REST
  que um client mobile consumiria com estratégia de token (a definir no
  momento da implementação do RN) — sem acoplar a lógica de negócio ao
  mecanismo de sessão do navegador.
- **Push desacoplado por canal**: o `NotificationOrchestrator` (Marco C) é
  desenhado com adapters (`WEB_PUSH`, `NATIVE_PUSH`, `WHATSAPP`, `EMAIL`)
  desde o schema de `notification_deliveries` — adicionar `NATIVE_PUSH` não
  exige alterar os demais.
- **UI não compartilhada**: `packages/ui-web` é explicitamente web-only
  (DOM/Tailwind). Não há tentativa de compartilhar componentes visuais com
  React Native — apenas tokens (`packages/design-tokens`) são reaproveitáveis
  como valores (cores, espaçamento), nunca como componentes.
- **Localização**: ver `ADR_PWA_GEOLOCATION_LIMITS.md` — interface
  `LocationProvider` isola a fonte de localização do restante do sistema.

## Consequências

- Construir o app RN no futuro é um trabalho de **novo client**, não de
  migração: reaproveita `contracts`, `api-client`, `domain` e os endpoints já
  documentados em OpenAPI, sem tocar em `apps/api` além de, no máximo,
  adicionar um mecanismo de token para mobile.
- Nenhuma lógica de negócio deve ser implementada apenas no frontend web —
  qualquer regra testável pertence a `packages/domain` ou à API.
