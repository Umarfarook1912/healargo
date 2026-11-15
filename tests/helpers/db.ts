/**
 * Connection resilience for tests that talk to a remote database.
 *
 *  - waitForDatabase(): pings with exponential backoff before a suite starts.
 *  - withDbRetry(): retries an operation that failed because the server could
 *    not be reached (the query never ran, so retrying is safe).
 *  - installRetryingPrisma(): makes the app's shared Prisma client (the one
 *    `@/lib/db/prisma` exports) retry those errors too. Must run before
 *    anything imports `@/lib/db/prisma`.
 */
import { Prisma, PrismaClient } from "@prisma/client";
import { testSettingNumber } from "./env";

const RETRY_CODES = new Set(["P1001", "P1002", "P1008", "P2024"]);
const ATTEMPTS = testSettingNumber("TEST_DB_RETRIES", 6);
const BASE_DELAY_MS = 1000;

export function isTransientDbError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientInitializationError) return true;
  if (error instanceof Prisma.PrismaClientKnownRequestError) return RETRY_CODES.has(error.code);
  const message = error instanceof Error ? error.message : String(error);
  return /Can't reach database server|Timed out fetching a new connection|connection pool/i.test(message);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function withDbRetry<T>(fn: () => Promise<T>, label = "database call"): Promise<T> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= ATTEMPTS || !isTransientDbError(error)) throw error;
      const delay = Math.min(BASE_DELAY_MS * 2 ** (attempt - 1), 30_000);
      console.warn(`[tests] ${label} failed (${(error as Error).message.split("\n").find(Boolean)}); retry ${attempt}/${ATTEMPTS - 1} in ${delay} ms`);
      await sleep(delay);
    }
  }
}

export async function waitForDatabase(client: { $queryRaw: PrismaClient["$queryRaw"] }) {
  await withDbRetry(() => client.$queryRaw`SELECT 1`, "connecting to the database");
}

type GlobalWithPrisma = typeof globalThis & { prisma?: unknown };

export function installRetryingPrisma(): PrismaClient {
  const g = globalThis as GlobalWithPrisma;
  if (g.prisma) return g.prisma as PrismaClient;
  const base = new PrismaClient({ log: ["error"] });
  const client = base.$extends({
    query: {
      async $allOperations({ args, query, operation, model }) {
        return withDbRetry(() => query(args), `${model ?? "prisma"}.${operation}`);
      },
    },
  });
  g.prisma = client;
  return client as unknown as PrismaClient;
}
