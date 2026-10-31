# Relatório de fidelidade visual

## Referência

`design/referencias/` contém as 12 pranchas originais (6 pranchas com 24
telas + 5 ampliações de detalhe + 1 referência estética de cliente), mapeadas
tela a tela em `docs/GUIA_REFERENCIAS_VISUAIS.md`. Essas imagens são a fonte
de verdade de layout/paleta/tipografia usada durante toda a implementação
(Marcos A–E).

## Como a fidelidade foi verificada de fato

Não existe comparação automatizada de pixel (pixel-diff) entre as telas
renderizadas e as pranchas de referência. O método real, usado em todas as
fases:

1. **Durante cada marco (A–E):** inspeção visual manual via Playwright —
   scripts descartáveis que navegavam a tela recém-implementada, tiravam
   screenshot e um humano/modelo comparava com a prancha correspondente,
   checando layout, paleta, tipografia e zero erro de console. Esses scripts
   nunca foram persistidos como testes reexecutáveis.
2. **A partir do Marco F4:** a verificação visual passou a ser uma suíte
   persistida em `tests/e2e/` (Playwright), mas com foco diferente —
   `accessibility.spec.ts` (axe-core, contraste/semântica) e
   `responsive.spec.ts` (ausência de overflow horizontal em mobile/tablet/
   desktop nas telas principais). Nenhuma dessas specs compara pixel contra
   as pranchas originais; elas verificam propriedades estruturais (contraste,
   overflow, presença de heading), não semelhança visual com a referência.
3. Capturas de tela ficam em `tests/e2e/test-results/` apenas quando um teste
   falha (`screenshot: "only-on-failure"` em `playwright.config.ts`) — não há
   um arquivo de capturas "golden" versionado para diffs futuros.

## Lacuna real

**Não há pixel-diff automatizado contra as pranchas de referência.** Qualquer
regressão visual sutil (um espaçamento, uma cor, uma proporção que diverge da
prancha) só é pega por revisão humana pontual, não por um gate de CI. Isso
está listado como lacuna real em `docs/qa/GAPS_REPORT.md`. Uma suíte futura
poderia usar `@playwright/test`'s `toHaveScreenshot()` com baselines
versionadas por tela, mas isso não existe hoje.
