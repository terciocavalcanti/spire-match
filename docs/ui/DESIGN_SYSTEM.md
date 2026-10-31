# Design System — VALORI MATCH

## Tokens de cor (`packages/design-tokens/src/colors.ts`)

Tema **light** é o único ativo hoje. O objeto `dark` existe como placeholder
estrutural preenchido, mas não é ligado a nenhuma lógica de troca de tema —
ver `docs/architecture/ADR_WEB_PWA_NATIVE_FUTURE.md` para o que falta para
ativá-lo.

### Background / ink / borda

| Token | Hex | Uso |
|---|---|---|
| `background.base` | `#F7F4EC` | Fundo off-white das telas |
| `background.elevated` | `#FFFFFF` | Cards, modais |
| `background.subtle` | `#EFEAE0` | Seções alternadas, inputs |
| `background.overlay` | `rgba(33,31,25,.55)` | Overlay sobre fotos (galeria, modais) |
| `ink.primary` | `#211F19` | Texto principal (headings, preços) |
| `ink.secondary` | `#5B5748` | Texto secundário (metadados: m², bairro) |
| `ink.tertiary` | `#686357` | Texto terciário / placeholder |
| `ink.inverse` | `#F7F4EC` | Texto sobre fundo escuro |
| `border.subtle` / `.strong` / `.focus` | `#E4DDCC` / `#C9BCA1` / `#333B28` | Bordas, foco de teclado |

### Marca

| Token | Hex | Uso |
|---|---|---|
| `brand.charcoal` / `.charcoalHover` | `#2A2820` / `#38352A` | CTA primário escuro |
| `brand.olive` / `.oliveHover` | `#333B28` / `#404A32` | Selo "% Match", estados ativos |
| `brand.taupe` | `#C9BCA1` | Acentos secundários |

### Status (lead score, badges informativos)

| Token | Hex (texto) | Hex (fundo) | Uso |
|---|---|---|---|
| `status.matchHigh` | `#333B28` | `#333B28` (badge sólido, texto `matchHighFg` `#F7F4EC`) | Compatibilidade alta |
| `status.priceDrop` | `#2E6F55` | — | Ícone de redução de preço |
| `status.hot` | `#A8431F` | `#F7DCCF` | Lead "muito quente" |
| `status.warm` | `#7A5A18` | `#F3E6CC` | Lead "aquecendo" |
| `status.info` | `#2F5F8F` | `#DCE8F5` | Badge informativo ("Em análise") |
| `status.success` | `#2E6F55` | `#DCEAE0` | Sucesso |
| `status.danger` | `#9C3C30` | `#F6DEDA` | Erro, exclusão |

**Nota de acessibilidade:** `ink.tertiary` e os quatro pares `hot`/`warm`/
`info`/`danger` foram escurecidos no Marco F5 — os valores originais (ex.:
`hot: #C65532`, `warm: #B98A3E`) tinham contraste insuficiente (3.07–3.69:1)
contra seus fundos reais. A suíte `tests/e2e/specs/accessibility.spec.ts`
(axe-core) roda em `/inicio`, `/explorar`, `/perfil`, `/admin` e
`/admin/leads` e falha em qualquer violação `critical`/`serious`; todos os
tokens acima foram recalculados para ≥4.5:1 (WCAG AA) contra o fundo real em
que aparecem e confirmados pela suíte.

## Tipografia (`packages/design-tokens/src/typography.ts`)

- Display/serif: **Fraunces** (headings, preços — ex. `displayLg` 32px/38px
  para "Bom dia, Tércio", `price` 26px/32px para "R$ 2.980.000").
- Corpo/sans: **Inter** (`bodyLg` 16px, `bodyMd` 14px, `bodySm` 13px,
  `caption` 11px/semibold para labels de chip/badge, `button` 15px/semibold).

## Espaçamento, raio e sombra (`packages/design-tokens/src/spacing.ts`)

- Escala base-4 (`spacing["1"]` = 4px até `spacing["24"]` = 96px).
- Raios: `sm` 8px até `2xl` 24px (cards de imóvel) e `pill` 999px (botões
  primários, chips de filtro).
- 4 níveis de sombra (`sm`→`xl`), sempre em preto translúcido sobre o fundo
  claro.
- Breakpoints mínimos exigidos para teste de responsividade: `xs` 320px,
  `sm`/`md` 375–390px, `tablet` 768px, `lg`/`xl` 1024–1440px.

## Inventário real de componentes (`packages/ui-web/src/components`)

| Componente | Propósito |
|---|---|
| `Button` | Botão com 5 variantes (`primary`/`secondary`/`outline`/`ghost`/`destructive`) e 4 tamanhos, via `class-variance-authority` |
| `Card` | Contêiner elevado genérico (`forwardRef<HTMLDivElement>`) |
| `Input` | Campo de texto com ícone opcional, estado de erro e `aria-describedby` |
| `CurrencyInput` | Campo de moeda BRL com máscara "de trás para frente"; aceita `aria-label` explícito (adicionado no Marco F5 para corrigir campos sem label associado) |
| `PropertyCard` | Card de imóvel (grade/lista): foto ou estado "Sem foto", badge de Match, favoritar, distância |
| `PropertyGallery` | Galeria de fotos do imóvel com slots `topLeftSlot`/`topRightSlot` (voltar, compartilhar, favoritar) |
| `MatchBadge` | Selo "% Match" circular, 2 tamanhos |
| `FilterChip` | Chip de filtro toggleável (estado ativo/inativo) |
| `BottomNavigation` | Navegação inferior fixa do comprador (5 itens, ver `ADR_NAVEGACAO.md`) |
| `SpireHeader` | Cabeçalho do app comprador: marca, sino de notificações, avatar com iniciais |
| `SpireMark` | Logomarca SVG |
| `EmptyState` | Estado vazio genérico (ícone, título, descrição, ação) |
| `AdminSidebar` | Navegação lateral do painel admin, por grupos de rota |

## Acessibilidade

- Contraste de cor validado automaticamente (ver seção de tokens acima).
- `label-content-name-mismatch` (texto visível não incluído no nome
  acessível) corrigido em três pontos reais encontrados pela suíte: avatar
  com iniciais (`SpireHeader`), card de imóvel sem foto (`PropertyCard`,
  texto "Sem foto") e campos de preferência sem `aria-label`/`htmlFor`
  (`PreferencesForm` no app `web`).
- Verificação restante (`meta-viewport`, `page-has-heading-one`) é logada
  pela suíte mas não bloqueia — ver `docs/qa/GAPS_REPORT.md`.
