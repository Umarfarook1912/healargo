import { FAKE_SERVICES_URL, loadTestEnv } from "../helpers/env";

export default async function globalTeardown() {
  loadTestEnv(FAKE_SERVICES_URL);
  const { prisma } = await import("@/lib/db/prisma");
  const { cleanupTestData } = await import("../fixtures/cleanup");
  const { RUN_ID } = await import("../fixtures/run");
  const counts = await cleanupTestData(prisma, RUN_ID);
  console.log("[e2e] cleanup", counts);
  await prisma.$disconnect();
}
