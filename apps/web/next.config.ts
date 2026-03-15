import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This is the ONLY configuration Next.js actually needs for a monorepo
  transpilePackages: ["@elite/shared"],
};

export default nextConfig;
