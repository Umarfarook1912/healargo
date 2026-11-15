/**
 * Per-file setup for the API suite (runs inside the test worker).
 *  - loads .env.test(.local), forces fakes/dummy secrets, checks the opt-in
 *  - mocks next/cache and the NextAuth `auth()` export
 *  - starts the fake Cashfree / ST Courier / Brevo server
 *  - after each file, deletes this run's rows (marker-scoped, FK-safe)
 */
import { afterAll, beforeAll, beforeEach, vi } from "vitest";
import { assertDatabaseWritesAllowed, loadTestEnv } from "../helpers/env";
import { resetFakeState, startFakeServices } from "../helpers/fake-services";
import { currentSession } from "../helpers/session";

loadTestEnv("http://127.0.0.1:1"); // real fake URL is set in beforeAll
assertDatabaseWritesAllowed();

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
  const { prisma } = await import("@/lib/db/prisma");
  const { cleanupTestData } = await import("../fixtures/cleanup");
  const { RUN_ID } = await import("../fixtures/run");
  await cleanupTestData(prisma, RUN_ID);
  await g.__hgFake?.stop();
  g.__hgFake = undefined;
});
