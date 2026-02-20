import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
  esbuild: {
    jsxInject: `import React from "react"`,
  },
  test: {
    environment: "jsdom",
    setupFiles: "./test/setup.ts",
  },
});
