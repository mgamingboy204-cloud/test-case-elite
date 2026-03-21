import { fileURLToPath } from "node:url";

const webRoot = fileURLToPath(new URL(".", import.meta.url));

export default {
  resolve: {
    alias: {
      "@": webRoot
    }
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    css: false,
    pool: "threads",
    minWorkers: 1,
    maxWorkers: 1,
    fileParallelism: false
  }
};
