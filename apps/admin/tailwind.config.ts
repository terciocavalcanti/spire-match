import { tailwindThemeExtend } from "@spire/design-tokens";
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}", "../../packages/ui-web/src/**/*.{ts,tsx}"],
  theme: {
    extend: tailwindThemeExtend,
  },
  plugins: [],
};

export default config;
