import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  transpilePackages: ["@elite/shared"],
  experimental: {
    // Allows Vercel to bundle files outside the apps/web directory
    outputFileTracingRoot: path.join(__dirname, "../../"),
    
    // THIS IS THE NEW FIX: Tells Turbopack where to find your shared package
    turbopack: {
      resolveAlias: {
        "@elite/shared": path.join(__dirname, "../../packages/shared"),
        "@elite/shared/*": path.join(__dirname, "../../packages/shared/*"),
      },
    },
  },
  
  // We keep this as a fallback just in case Vercel decides to use Webpack
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@elite/shared": path.resolve(__dirname, "../../packages/shared"),
    };
    return config;
  },
};

export default nextConfig;
