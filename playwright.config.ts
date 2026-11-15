/**
 * End-to-end tests: a real browser against `next dev` on port 3100.
 *
 *  - The app uses the database in DATABASE_URL (from .env.test.local) and
 *    WRITES test rows to it (marked "hgtest", deleted in global teardown).
 *  - Cashfree, ST Courier and Brevo are replaced by the local fake server
 *    (tests/e2e/fake-server.ts) through CASHFREE_BASE_URL, ST_COURIER_BASE_URL
 *    and BREVO_API_URL. The Cashfree browser SDK is swapped by page.route.
 *
 * See tests/README.md.
 */
import { defineConfig, devices } from "@playwright/test";
import { FAKE_SERVICES_URL, forcedTestEnv, loadTestEnv } from "./tests/helpers/env";

loadTestEnv(FAKE_SERVICES_URL);
process.env.TEST_RUN_ID ||= `hgtest${Date.now().toString(36)}e2e`;

const PORT = Number(process.env.E2E_PORT || 3100);
const baseURL = `http://localhost:${PORT}`;
process.env.E2E_BASE_URL = baseURL;

const appEnv: Record<string, string> = {
  ...forcedTestEnv(FAKE_SERVICES_URL),
  DATABASE_URL: process.env.DATABASE_URL ?? "",
  DIRECT_URL: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  NEXT_PUBLIC_SITE_URL: baseURL,
  AUTH_URL: baseURL,
  NEXTAUTH_URL: baseURL,
  AUTH_TRUST_HOST: "true",
  NEXT_TELEMETRY_DISABLED: "1",
};

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 120_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  globalSetup: "./tests/e2e/global-setup.ts",
  globalTeardown: "./tests/e2e/global-teardown.ts",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    navigationTimeout: 90_000,
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // PW_CHANNEL=chrome uses an installed Google Chrome instead of
        // `npx playwright install chromium`.
        ...(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {}),
      },
    },
  ],
  webServer: [
    {
      command: "npx tsx tests/e2e/fake-server.ts",
      url: `${FAKE_SERVICES_URL}/__fake/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: `npx next dev -p ${PORT}`,
      url: `${baseURL}/api/catalog/highlights`,
      reuseExistingServer: !process.env.CI,
      timeout: 240_000,
      env: appEnv,
    },
  ],
});
