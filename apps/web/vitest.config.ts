import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  esbuild: {
    jsx: "automatic"
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "@elite/contracts": path.resolve(__dirname, "../../packages/contracts/src")
    }
  },
  test: {
    environment: "jsdom",
    setupFiles: "./test/setup.ts"
  }
});
