// Escala base-4, conforme o respiro generoso observado nas pranchas.
export const spacing = {
  "0": "0px",
  "1": "4px",
  "2": "8px",
  "3": "12px",
  "4": "16px",
  "5": "20px",
  "6": "24px",
  "8": "32px",
  "10": "40px",
  "12": "48px",
  "16": "64px",
  "20": "80px",
  "24": "96px",
} as const;

// Raios: cards grandes bem arredondados, botões em pill, badges médios.
export const radii = {
  none: "0px",
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "20px",
  "2xl": "24px", // cards de imóvel
  pill: "999px", // botões primários, chips de filtro
} as const;

export const shadows = {
  sm: "0 1px 2px rgba(33, 31, 25, 0.06)",
  md: "0 4px 12px rgba(33, 31, 25, 0.08)",
  lg: "0 12px 32px rgba(33, 31, 25, 0.12)",
  xl: "0 24px 48px rgba(33, 31, 25, 0.16)",
} as const;

// Breakpoints mínimos exigidos para teste de responsividade (seção 13 do prompt).
export const breakpoints = {
  xs: "320px",
  sm: "375px",
  md: "390px",
  tablet: "768px",
  lg: "1024px",
  xl: "1440px",
} as const;
