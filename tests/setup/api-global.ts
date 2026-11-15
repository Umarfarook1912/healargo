/**
 * Global setup/teardown for the API suite (runs once, in the main process).
 * Prints which database is written to, and at the end sweeps any rows left
 * by crashed runs (everything carrying the "hgtest" marker).
 */
import { assertDatabaseWritesAllowed, describeDatabase, loadTestEnv } from "../helpers/env";

export async function setup() {
  loadTestEnv();
  assertDatabaseWritesAllowed();
  console.warn(
    `\n[tests] API suite WRITES test rows (marked "hgtest") to ${describeDatabase()} and deletes them afterwards.\n`,
  );
  return async () => {
    const { PrismaClient } = await import("@prisma/client");
    const { cleanupTestData } = await import("../fixtures/cleanup");
    const prisma = new PrismaClient();
    try {
      const counts = await cleanupTestData(prisma, "hgtest");
      const left = Object.entries(counts).filter(([, n]) => n > 0);
      if (left.length) console.warn("[tests] swept leftover test rows:", Object.fromEntries(left));
    } finally {
      await prisma.$disconnect();
    }
  };
}
