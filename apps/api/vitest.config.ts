import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@elite/contracts": path.resolve(__dirname, "../../packages/contracts/src"),
      "@elite/shared": path.resolve(__dirname, "../../packages/shared/src")
    }
  },
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"]
  }
});
