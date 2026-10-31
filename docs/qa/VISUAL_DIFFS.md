# Diffs visuais

Metodologia real de verificação visual usada no projeto. Para a análise de
fidelidade às referências originais (`design/referencias/` e
`docs/GUIA_REFERENCIAS_VISUAIS.md`), ver `docs/ui/VISUAL_FIDELITY_REPORT.md`
— este documento cobre especificamente como regressões visuais foram (e
são) detectadas marco a marco.

## O que existe hoje

- **Nenhum diff de pixel automatizado.** O projeto não usa uma ferramenta
  de comparação de screenshot pixel-a-pixel (ex.: Percy, Chromatic,
  `playwright`'s `toHaveScreenshot` com baseline commitada). Isso é uma
  lacuna real, não uma omissão de documentação — ver `docs/qa/GAPS_REPORT.md`.
- **Verificação manual por screenshot, marco a marco (Marcos A–E).** Cada
  fase era encerrada com uma rodada de Playwright navegando pelas telas
  novas/alteradas, tirando screenshot e revisando visualmente contra a
  referência e contra o estado anterior, checando também zero erro de
  console. Os scripts eram descartáveis — não ficam no repositório.
- **Suíte e2e persistida com captura automática em falha (Marco F4+).**
  `tests/e2e/playwright.config.ts` configura
  `screenshot: "only-on-failure"` e `trace: "retain-on-failure"` — toda
  falha de teste gera evidência visual automaticamente, mas isso é
  diagnóstico de falha, não comparação de baseline.
- **Varredura de acessibilidade e responsividade automatizada (Marco F5).**
  `specs/accessibility.spec.ts` e `specs/responsive.spec.ts` cobrem
  contraste de cor e overflow horizontal em mobile/tablet/desktop — não são
  diffs visuais, mas capturam uma classe real de regressão visual
  (quebra de layout, texto ilegível).

## Como isso seria evoluído

Adicionar `expect(page).toHaveScreenshot()` com baseline commitada em
`tests/e2e/specs/` para as telas mais estáveis seria o próximo passo mais
direto, mas introduz manutenção de baseline (re-gerar a cada mudança visual
intencional) que não foi assumida neste marco — decisão explícita de escopo,
não esquecimento.
