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

/**
 * Clicks "Pay" and waits for the Cashfree redirect to the confirmation page.
 * A click that lands before hydration sends nothing, so click again only
 * while no order request went out (never creates two orders).
 */
async function clickPay(page: Page) {
  await expect(async () => {
    const sent = page.waitForRequest((r) => r.method() === "POST" && new URL(r.url()).pathname === "/api/orders", {
      timeout: 5000,
    });
    await page.getByRole("button", { name: /^pay /i }).click({ timeout: 5000 });
    await sent;
  }).toPass({ timeout: 90_000 });
  await expect(page).toHaveURL(/\/orders\/[^/]+\/confirmation/, { timeout: 120_000 });
}

async function addToCartAndCheckout(page: Page) {
  const w = world();
  await page.goto(`/products/${w.product.slug}`);
  const items = () =>
    page.evaluate(() => JSON.parse(localStorage.getItem("healargo-cart") ?? "{}").state?.items?.length ?? 0);
  // A click before hydration is lost; click again only while the cart is empty.
  await expect(async () => {
    if ((await items()) === 0) await page.getByRole("button", { name: /add to cart/i }).click({ timeout: 5000 });
    expect(await items()).toBe(1);
  }).toPass({ timeout: 90_000 });
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
  await clickPay(page);
  // The confirmation page syncs with Cashfree on the server, sees PAID and
  // the client goes straight to the orders tab.
  const orderId = /\/orders\/([^/]+)\/confirmation/.exec(page.url())![1];
  // The URL changes as soon as the streamed page starts; the server-side sync
  // may still be running (slow on a remote DB), so wait for the DB state.
  const state = async () => {
    const o = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
    return { paymentStatus: o.paymentStatus, status: o.status, stockDecremented: o.stockDecremented };
  };
  await expect
    .poll(state, { timeout: 90_000 })
    .toEqual({ paymentStatus: "PAID", status: "CONFIRMED", stockDecremented: true });
  expect(await stock()).toBe(before - 1);
  await page.waitForURL(/\/profile/, { timeout: 90_000 });
  const cart = await page.evaluate(() => localStorage.getItem("healargo-cart"));
  expect(JSON.parse(cart ?? "{}").state?.items ?? []).toHaveLength(0);
});

test("PAY-028 + PAY-029 cancelled payment: order FAILED, stock unchanged, cart kept", async ({ page }) => {
  const before = await stock();
  await login(page, world().customerA.email);
  await expect(page).toHaveURL((url) => url.pathname === "/");
  await addToCartAndCheckout(page);
  await fakeControl("/__fake/next-checkout", { outcome: "EXPIRED" });
  await clickPay(page);
  await expect(page.getByText(/payment failed/i)).toBeVisible();
  const orderId = /\/orders\/([^/]+)\/confirmation/.exec(page.url())![1];
  await expect
    .poll(async () => (await prisma.order.findUniqueOrThrow({ where: { id: orderId } })).paymentStatus, { timeout: 90_000 })
    .toBe("FAILED");
  expect(await stock()).toBe(before);
  const cart = await page.evaluate(() => localStorage.getItem("healargo-cart"));
  expect(JSON.parse(cart ?? "{}").state?.items?.length ?? 0).toBeGreaterThan(0);
});
