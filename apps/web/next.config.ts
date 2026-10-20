import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@spire/ui-web", "@spire/design-tokens", "@spire/contracts", "@spire/api-client"],
  images: {
    // Hospedagem de fotos de imóveis via S3-compatible (R2/MinIO) — hosts
    // reais serão adicionados conforme o provedor for configurado (Marco B).
    remotePatterns: [{ protocol: "https", hostname: "**.r2.dev" }],
  },
};

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  // Em dev o service worker é verificável, mas evita cachear o HTML das
  // rotas (Fast Refresh fica instável com SW ativo cacheando navegação).
  disable: process.env.NODE_ENV === "development" && process.env.SW_DEV_ENABLE !== "true",
});

export default withSerwist(nextConfig);
