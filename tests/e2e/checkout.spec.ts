import { expect, test, type Page } from "@playwright/test";
import { prisma } from "@/lib/db/prisma";
import { fakeControl, login, prepare, world } from "./support";

test.beforeEach(async ({ page }) => {
  await prepare(page);
  await fakeControl("/__fake/reset", {});
});
test.afterAll(async () => prisma.$disconnect());

async function stock() {
  const w = world();
  const p = await prisma.product.findUniqueOrThrow({ where: { id: w.product.id } });
  return (p.variants as Array<{ _id: string; stock: number }>).find((v) => v._id === w.product.variantIds[0])!.stock;
}

async function addToCartAndCheckout(page: Page) {
  const w = world();
  await page.goto(`/products/${w.product.slug}`);
  await page.getByRole("button", { name: /add to cart/i }).click();
  await page.goto("/checkout");
  await page.locator("#firstName").fill("Test");
  await page.locator("#lastName").fill(`Buyer ${w.runId}`);
  await page.locator("#phone").fill("9876543210");
  await page.locator("#email").fill(w.customerA.email);
  await page.locator("#line1").fill("1 Test Street");
  await page.locator("#city").fill("Chennai");
  await page.locator("#state").fill("Tamil Nadu");
  await page.locator("#pincode").fill("600001");
  await page.getByRole("button", { name: /continue to payment/i }).click();
}

test("CHK-018 + ORD-005 happy path (confirmation page syncs the payment): pay, confirm, stock decremented once, cart emptied", async ({ page }) => {
  const before = await stock();
  await login(page, world().customerA.email);
  await expect(page).toHaveURL((url) => url.pathname === "/");
  await addToCartAndCheckout(page);
  await fakeControl("/__fake/next-checkout", { outcome: "PAID" });
  await page.getByRole("button", { name: /^pay /i }).click();
  await expect(page).toHaveURL(/\/orders\/[^/]+\/confirmation/, { timeout: 60_000 });
  // The confirmation page syncs with Cashfree on the server, sees PAID and
  // the client goes straight to the orders tab.
  const orderId = /\/orders\/([^/]+)\/confirmation/.exec(page.url())![1];
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
  expect(order).toMatchObject({ paymentStatus: "PAID", status: "CONFIRMED", stockDecremented: true });
  expect(await stock()).toBe(before - 1);
  await page.waitForURL(/\/profile/);
  const cart = await page.evaluate(() => localStorage.getItem("healargo-cart"));
  expect(JSON.parse(cart ?? "{}").state?.items ?? []).toHaveLength(0);
});

test("PAY-028 + PAY-029 cancelled payment: order FAILED, stock unchanged, cart kept", async ({ page }) => {
  const before = await stock();
  await login(page, world().customerA.email);
  await expect(page).toHaveURL((url) => url.pathname === "/");
  await addToCartAndCheckout(page);
  await fakeControl("/__fake/next-checkout", { outcome: "EXPIRED" });
  await page.getByRole("button", { name: /^pay /i }).click();
  await expect(page).toHaveURL(/\/orders\/[^/]+\/confirmation/, { timeout: 60_000 });
  await expect(page.getByText(/payment failed/i)).toBeVisible();
  const orderId = /\/orders\/([^/]+)\/confirmation/.exec(page.url())![1];
  expect((await prisma.order.findUniqueOrThrow({ where: { id: orderId } })).paymentStatus).toBe("FAILED");
  expect(await stock()).toBe(before);
  const cart = await page.evaluate(() => localStorage.getItem("healargo-cart"));
  expect(JSON.parse(cart ?? "{}").state?.items?.length ?? 0).toBeGreaterThan(0);
});
