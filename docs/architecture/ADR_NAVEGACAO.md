# ADR — Consolidação da navegação principal do comprador

**Status:** Aceito · Marco A

## Contexto

As seis pranchas de referência não são internamente consistentes:

- `01_fluxo_inicial.png` e `02_exploracao_e_mapa.png` mostram bottom nav
  `Início · Explorar · Matches · Mensagens · Perfil`.
- `03_interacao_e_match.png` (telas de Favoritos) mostra
  `Início · Explorar · Favoritos · Mensagens · Perfil`.
- As cinco telas ampliadas (`07`–`10`) mostram
  `Início · Explorar · Match · Favoritos · Perfil` (sem Mensagens).

O `PROMPT_MESTRE_ANTIGRAVITY.md` (seção 2) já antecipa a divergência e
instrui explicitamente: consolidar uma navegação única, manter acesso a
Favoritos em no máximo um toque, e documentar a decisão — sem tratar isso
como ambiguidade impeditiva.

## Decisão

Bottom nav fixo com **5 itens**, em todas as telas do comprador:

1. Início (`/inicio`)
2. Explorar (`/explorar`)
3. Matches (`/matches/descobrir`)
4. Mensagens (`/mensagens`)
5. Perfil (`/perfil`)

Favoritos **não ocupa aba própria**. Fica acessível em 1 toque via:

- Ícone de coração em todo `PropertyCard` (toggle direto, sem navegação).
- Atalho de destaque na Home (`/inicio`).
- Item de menu rápido na tela de Perfil.
- Rota própria `/favoritos` continua existindo e sendo totalmente navegável.

## Consequências

- Implementação única de `BottomNavigation` (`packages/ui-web`), sem variantes
  por tela — reduz risco de inconsistência futura.
- `Mensagens` passa a ser uma rota de primeira classe (inbox consolidado de
  conversas com consultores por imóvel), introduzida no Marco C junto do
  `NotificationOrchestrator`. Antes disso, a rota existe como placeholder
  real (não um link quebrado).
- Qualquer nova tela do comprador deve reusar `BottomNavigation` com os
  mesmos 5 itens — não introduzir uma sexta aba nem variantes de "Match" vs
  "Favoritos" como item de navegação.
