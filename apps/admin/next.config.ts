import path from "node:path";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Imagem Docker de produção usa `.next/standalone` — precisa da raiz do
  // monorepo para rastrear corretamente as dependências via symlinks pnpm.
  outputFileTracingRoot: path.join(__dirname, "../../"),
  output: "standalone",
  transpilePackages: ["@spire/ui-web", "@spire/design-tokens", "@spire/contracts", "@spire/api-client"],
};

export default nextConfig;
