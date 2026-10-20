/**
 * As pranchas usam uma serif elegante para headings/preços e uma sans
 * legível para corpo/metadados. Escolha concreta (Google Fonts, pt-BR
 * completo, fáceis de hospedar via next/font):
 *  - Display/serif: Fraunces
 *  - Corpo/sans: Inter
 */
export const typography = {
  fontFamily: {
    display: "'Fraunces', 'Iowan Old Style', Georgia, serif",
    body: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  weight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  scale: {
    displayLg: { fontFamily: "display", size: "32px", lineHeight: "38px", weight: 500 }, // "Bom dia, Tércio"
    displayMd: { fontFamily: "display", size: "26px", lineHeight: "32px", weight: 500 }, // "Atlântico Residence"
    displaySm: { fontFamily: "display", size: "22px", lineHeight: "28px", weight: 500 }, // headings de seção
    price: { fontFamily: "display", size: "26px", lineHeight: "32px", weight: 500 }, // "R$ 2.980.000"
    bodyLg: { fontFamily: "body", size: "16px", lineHeight: "24px", weight: 400 },
    bodyMd: { fontFamily: "body", size: "14px", lineHeight: "20px", weight: 400 },
    bodySm: { fontFamily: "body", size: "13px", lineHeight: "18px", weight: 400 },
    caption: { fontFamily: "body", size: "11px", lineHeight: "16px", weight: 500 }, // labels de chip/badge
    button: { fontFamily: "body", size: "15px", lineHeight: "20px", weight: 600 },
  },
} as const;
