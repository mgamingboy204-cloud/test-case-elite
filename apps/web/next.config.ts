import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  transpilePackages: ["@elite/shared"],
  experimental: {
    // This allows Vercel to bundle files that live outside the apps/web directory
    outputFileTracingRoot: path.join(__dirname, "../../"),
  },
  webpack: (config) => {
    // This forces Webpack to look in the actual folder instead of node_modules
    config.resolve.alias = {
      ...config.resolve.alias,
      "@elite/shared": path.resolve(__dirname, "../../packages/shared"),
    };
    return config;
  },
};

export default nextConfig;
