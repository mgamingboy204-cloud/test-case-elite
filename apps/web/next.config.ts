import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This tells Next.js to bundle your shared monorepo package 
  // so Vercel doesn't throw a "Module not found" error.
  transpilePackages: ["@elite/shared"],
  
  /* other config options here */
};

export default nextConfig;
