import fs from "node:fs";
import path from "node:path";
import { assertDatabaseWritesAllowed, describeDatabase, FAKE_SERVICES_URL, loadTestEnv } from "../helpers/env";

export const WORLD_FILE = path.join(__dirname, ".auth", "world.json");

export default async function globalSetup() {
  loadTestEnv(FAKE_SERVICES_URL);
  assertDatabaseWritesAllowed();
  console.warn(`\n[e2e] WRITES test rows (marked "hgtest") to ${describeDatabase()} and deletes them afterwards.\n`);

  const { createUser, createCategory, createProduct, createCoupon } = await import("../fixtures/factory");
  const { RUN_ID } = await import("../fixtures/run");
  const [customerA, customerB, admin] = await Promise.all([
    createUser({ name: "E2E Customer A" }),
    createUser({ name: "E2E Customer B" }),
    createUser({ name: "E2E Admin", role: "admin" }),
  ]);
  const category = await createCategory({ name: `E2E Oils ${RUN_ID}` });
  const product = await createProduct({
    categoryId: category.id,
    name: `E2E Sesame Oil ${RUN_ID}`,
    variants: [
      { label: "1L", price: 350, originalPrice: 400, stock: 10 },
      { label: "5L", price: 1600, originalPrice: 1800, stock: 0 },
    ],
  });
  const inactive = await createProduct({ categoryId: category.id, name: `E2E Hidden ${RUN_ID}`, isActive: false });
  const coupon = await createCoupon({ discountType: "PERCENTAGE", discountValue: 10 });

  const world = {
    runId: RUN_ID,
    password: "secret123",
    customerA: { id: customerA.id, email: customerA.email },
    customerB: { id: customerB.id, email: customerB.email },
    admin: { id: admin.id, email: admin.email },
    product: { id: product.id, slug: product.slug, name: product.name, variantIds: product.variantIds },
    inactive: { id: inactive.id, slug: inactive.slug, name: inactive.name },
    coupon: { code: coupon.code },
  };
  fs.mkdirSync(path.dirname(WORLD_FILE), { recursive: true });
  fs.writeFileSync(WORLD_FILE, JSON.stringify(world, null, 2));
  const { prisma } = await import("@/lib/db/prisma");
  await prisma.$disconnect();
}
