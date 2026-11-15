/**
 * Per-file setup for the API suite (runs inside the test worker).
 *  - loads .env.test(.local), forces fakes/dummy secrets, checks the opt-in
 *  - mocks next/cache and the NextAuth `auth()` export
 *  - starts the fake Cashfree / ST Courier / Brevo server
 *  - after each file, deletes this run's rows (marker-scoped, FK-safe)
 */
import { afterAll, beforeAll, beforeEach, vi } from "vitest";
import { installRetryingPrisma, waitForDatabase, withDbRetry } from "../helpers/db";
import { assertDatabaseWritesAllowed, loadTestEnv } from "../helpers/env";
import { resetFakeState, startFakeServices } from "../helpers/fake-services";
import { currentSession } from "../helpers/session";

loadTestEnv("http://127.0.0.1:1"); // real fake URL is set in beforeAll
assertDatabaseWritesAllowed();
// Before any test imports `@/lib/db/prisma`: the app's client then retries
// "can't reach database" errors with backoff (remote DB).
const prisma = installRetryingPrisma();

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: (fn: unknown) => fn,
}));

vi.mock("@/lib/auth/auth", () => ({
  auth: vi.fn(async () => currentSession()),
  signIn: vi.fn(),
  signOut: vi.fn(),
  handlers: { GET: vi.fn(), POST: vi.fn() },
}));

type Fake = Awaited<ReturnType<typeof startFakeServices>>;
const g = globalThis as typeof globalThis & { __hgFake?: Fake };

beforeAll(async () => {
  await waitForDatabase(prisma);
  g.__hgFake = await startFakeServices(0);
  const url = g.__hgFake.url;
  process.env.CASHFREE_BASE_URL = url;
  process.env.ST_COURIER_BASE_URL = url;
  process.env.BREVO_API_URL = `${url}/v3/smtp/email`;
});

beforeEach(() => {
  if (g.__hgFake) resetFakeState(g.__hgFake.state);
});

afterAll(async () => {
  const { cleanupTestData } = await import("../fixtures/cleanup");
  const { RUN_ID } = await import("../fixtures/run");
  try {
    await withDbRetry(() => cleanupTestData(prisma, RUN_ID), "cleanup");
  } catch (error) {
    // Leftovers are swept by the global teardown and by `npm run test:cleanup`.
    console.warn("[tests] cleanup after file failed:", (error as Error).message);
  }
  await g.__hgFake?.stop();
  g.__hgFake = undefined;
});
