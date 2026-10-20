import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@spire/ui-web", "@spire/design-tokens", "@spire/contracts", "@spire/api-client"],
};

export default nextConfig;
