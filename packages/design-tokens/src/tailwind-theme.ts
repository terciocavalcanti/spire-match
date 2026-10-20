import { colors } from "./colors";
import { breakpoints, radii, shadows, spacing } from "./spacing";
import { typography } from "./typography";

type FontSizeEntry = [string, { lineHeight: string; fontWeight: number }];

const fontSize = Object.fromEntries(
  Object.entries(typography.scale).map(([key, value]) => [
    key,
    [value.size, { lineHeight: value.lineHeight, fontWeight: value.weight }] satisfies FontSizeEntry,
  ]),
) as Record<keyof typeof typography.scale, FontSizeEntry>;

/**
 * Reshape dos tokens para o formato `theme.extend` do Tailwind.
 * Consumido por `apps/web/tailwind.config.ts` e `apps/admin/tailwind.config.ts` —
 * única fonte de verdade de tokens, sem duplicar valores por app.
 */
export const tailwindThemeExtend = {
  colors: {
    background: colors.light.background,
    ink: colors.light.ink,
    brand: colors.light.brand,
    border: colors.light.border,
    status: colors.light.status,
    chip: colors.light.chip,
  },
  fontFamily: {
    // Vinculado às variáveis CSS injetadas por next/font em apps/web e
    // apps/admin (ver src/app/layout.tsx) — fallback cobre SSR/no-JS.
    display: ["var(--font-display)", "Georgia", "serif"] as string[],
    body: ["var(--font-body)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"] as string[],
  },
  fontSize,
  spacing,
  borderRadius: radii,
  boxShadow: shadows,
  screens: breakpoints,
};
