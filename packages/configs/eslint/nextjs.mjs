// @ts-check
// eslint-config-next@16 já exporta um array de flat config pronto (next +
// next/typescript combinados) — nada de FlatCompat/eslintrc aqui.
import nextPlugin from "eslint-config-next";

import base from "./base.mjs";

export default [
  ...base,
  ...nextPlugin,
  {
    rules: {
      // PWA screens intentionally use <img> for user-uploaded property photos
      // in a few places before next/image remote patterns are fully configured.
      "@next/next/no-img-element": "warn",
    },
  },
  {
    // Assets estáticos vendorizados (ex.: public/maplibre-gl-worker.mjs) nunca
    // devem ser tratados como código-fonte do projeto.
    ignores: ["public/**"],
  },
];
