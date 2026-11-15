/**
 * `npm run test:cleanup`: deletes leftover test rows from the database in
 * DATABASE_URL, for example after an interrupted run, and prints the counts.
 * Only rows carrying the "hgtest" marker are touched (tests/fixtures/cleanup.ts).
 *
 *   npm run test:cleanup              delete and report
 *   npm run test:cleanup -- --dry-run count only, delete nothing
 */
import { PrismaClient } from "@prisma/client";
import { cleanupTestData } from "./fixtures/cleanup";
import { MARKER } from "./fixtures/run";
import { waitForDatabase, withDbRetry } from "./helpers/db";
import { assertDatabaseWritesAllowed, describeDatabase, loadTestEnv } from "./helpers/env";

class DryRun extends Error {}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  loadTestEnv();
  assertDatabaseWritesAllowed();
  console.log(`[test:cleanup] ${dryRun ? "Counting" : "Deleting"} rows marked "${MARKER}" in ${describeDatabase()}`);
  const prisma = new PrismaClient();
  try {
    await waitForDatabase(prisma);
    let counts: Record<string, number> = {};
    if (dryRun) {
      // Run the real deletes inside a transaction and roll it back.
      await prisma
        .$transaction(
          async (tx) => {
            counts = await cleanupTestData(tx as unknown as PrismaClient, MARKER);
            throw new DryRun();
          },
          { timeout: 600_000, maxWait: 120_000 },
        )
        .catch((error) => {
          if (!(error instanceof DryRun)) throw error;
        });
    } else {
      counts = await withDbRetry(() => cleanupTestData(prisma, MARKER), "cleanup");
    }
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    console.table(counts);
    console.log(
      total === 0
        ? "[test:cleanup] No leftover test rows."
        : `[test:cleanup] ${dryRun ? "Would delete" : "Deleted"} ${total} test row(s).`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("[test:cleanup] failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
