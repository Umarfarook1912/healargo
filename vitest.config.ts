import { defineConfig } from "vitest/config";
import path from "path";
import { TEST_HOOK_TIMEOUT_MS, TEST_TIMEOUT_MS } from "./tests/helpers/env";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: ["tests/unit/**/*.test.ts", "src/**/*.test.ts"],
          setupFiles: ["tests/setup/unit.ts"],
          // next-auth imports "next/server" without an extension; let Vite resolve it.
          server: { deps: { inline: ["next-auth"] } },
        },
      },
      {
        extends: true,
        test: {
          // Writes to the database in DATABASE_URL (see tests/README.md).
          name: "api",
          environment: "node",
          include: ["tests/api/**/*.test.ts"],
          setupFiles: ["tests/setup/api.ts"],
          globalSetup: ["tests/setup/api-global.ts"],
          // One file at a time: the suites share one database.
          fileParallelism: false,
          poolOptions: { forks: { singleFork: true } },
          pool: "forks",
          // Remote DB: ~0.2-0.5 s per query. Override with TEST_TIMEOUT_MS /
          // TEST_HOOK_TIMEOUT_MS in .env.test.local.
          testTimeout: TEST_TIMEOUT_MS,
          hookTimeout: TEST_HOOK_TIMEOUT_MS,
          teardownTimeout: TEST_HOOK_TIMEOUT_MS,
        },
      },
    ],
  },
});
