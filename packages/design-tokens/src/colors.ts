/**
 * Paleta extraída por inspeção visual das 24 telas de referência
 * (design/referencias/01..11). Valores são aproximações iniciais —
 * ajustar por comparação de screenshot em docs/qa/visuais/ durante o Marco A.
 * Estrutura preparada para light theme agora e dark theme no futuro
 * (ver `dark` como placeholder a ser preenchido, não ativado por padrão).
 */
export const colors = {
  light: {
    background: {
      base: "#F7F4EC", // off-white / ivory de fundo das telas
      elevated: "#FFFFFF", // cards, modais
      subtle: "#EFEAE0", // seções alternadas, inputs
      overlay: "rgba(33, 31, 25, 0.55)", // overlays sobre fotos (galeria, modais)
    },
    ink: {
      primary: "#211F19", // texto principal (headings, preços)
      secondary: "#5B5748", // texto secundário (metadados: m², bairro)
      tertiary: "#686357", // texto terciário / placeholder (ajustado p/ contraste AA 4.5:1 — Marco F5)
      inverse: "#F7F4EC", // texto sobre fundos escuros
    },
    brand: {
      charcoal: "#2A2820", // CTA primário escuro ("Começar", "Continuar", "Confirmar")
      charcoalHover: "#38352A",
      olive: "#333B28", // selo "% MATCH", estados ativos de chips/nav
      oliveHover: "#404A32",
      taupe: "#C9BCA1", // acentos secundários, ícones sobre bege
    },
    border: {
      subtle: "#E4DDCC",
      strong: "#C9BCA1",
      focus: "#333B28",
    },
    status: {
      matchHigh: "#333B28", // badge verde-oliva de compatibilidade alta
      matchHighBg: "#333B28",
      matchHighFg: "#F7F4EC",
      priceDrop: "#2E6F55", // indicador de redução de preço (ícone seta verde)
      hot: "#A8431F", // lead score "muito quente" (ajustado p/ contraste AA 4.5:1 — Marco F5)
      hotBg: "#F7DCCF",
      warm: "#7A5A18", // lead score "aquecendo" (ajustado p/ contraste AA 4.5:1 — Marco F5)
      warmBg: "#F3E6CC",
      info: "#2F5F8F", // badges informativos ("Em análise") (ajustado p/ contraste AA 4.5:1 — Marco F5)
      infoBg: "#DCE8F5",
      success: "#2E6F55",
      successBg: "#DCEAE0",
      danger: "#9C3C30", // ajustado p/ contraste AA 4.5:1 — Marco F5
      dangerBg: "#F6DEDA",
    },
    chip: {
      activeBg: "#2A2820",
      activeFg: "#F7F4EC",
      inactiveBg: "#EFEAE0",
      inactiveFg: "#5B5748",
    },
  },
  // Placeholder estrutural — não ativado por padrão (ver ADR de tema futuro).
  dark: {
    background: { base: "#17160F", elevated: "#201F17", subtle: "#272619", overlay: "rgba(0,0,0,0.6)" },
    ink: { primary: "#F2EFE5", secondary: "#C6C0AE", tertiary: "#948E79", inverse: "#17160F" },
    brand: { charcoal: "#E9E5D8", charcoalHover: "#D9D4C2", olive: "#8FA377", oliveHover: "#A3B88C", taupe: "#7C705A" },
    border: { subtle: "#33311F", strong: "#4A472F", focus: "#8FA377" },
    status: {
      matchHigh: "#8FA377",
      matchHighBg: "#39402D",
      matchHighFg: "#F2EFE5",
      priceDrop: "#7FC9A8",
      hot: "#E79A78",
      hotBg: "#4A3023",
      warm: "#E1C078",
      warmBg: "#473A1F",
      info: "#8FB6DD",
      infoBg: "#23344A",
      success: "#7FC9A8",
      successBg: "#1F3A2E",
      danger: "#E2897C",
      dangerBg: "#4A2420",
    },
    chip: { activeBg: "#E9E5D8", activeFg: "#17160F", inactiveBg: "#272619", inactiveFg: "#C6C0AE" },
  },
} as const;

export type ColorTheme = keyof typeof colors;
