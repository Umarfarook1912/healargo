import { expect, test } from "@playwright/test";
import { prisma } from "@/lib/db/prisma";
import { createOrder } from "../fixtures/factory";
import { expectNotFound, expectOnLogin, fakeControl, login, prepare, world } from "./support";

test.beforeEach(async ({ page }) => prepare(page));
test.afterAll(async () => prisma.$disconnect());

async function orderForA() {
  const w = world();
  return createOrder({
    userId: w.customerA.id,
    paymentStatus: "PAID",
    status: "CONFIRMED",
    items: [{ productId: w.product.id, variantId: w.product.variantIds[0], quantity: 1 }],
  });
}

test("ORD-004 confirmation page needs login", async ({ page }) => {
  const order = await orderForA();
  await page.goto(`/orders/${order.id}/confirmation`);
  await expectOnLogin(page, `/orders/${order.id}/confirmation`);
});

test("ORD-003 another customer's order pages are 404", async ({ page }) => {
  const order = await orderForA();
  await login(page, world().customerB.email);
  await expect(page).toHaveURL((url) => url.pathname === "/");
  for (const suffix of ["", "/confirmation", "/tracking"]) {
    const res = await page.goto(`/orders/${order.id}${suffix}`);
    const body = await expectNotFound(res);
    expect(body).not.toContain(world().customerA.email);
  }
});

test("ADM smoke: admin sees the orders list and an order", async ({ page }) => {
  const order = await orderForA();
  await login(page, world().admin.email);
  await expect(page).toHaveURL((url) => url.pathname === "/");
  await page.goto("/admin/orders");
  await expect(page).toHaveURL(/\/admin\/orders/);
  await page.goto(`/admin/orders/${order.id}`);
  await expect(page.getByText(order.id.slice(-8).toUpperCase()).first()).toBeVisible();
});

test("ADM-ORD-021 order detail UI: status, tracking, sync, refund", async ({ page }) => {
  const order = await orderForA();
  const awb = `9${String(Date.now()).slice(-10)}`;
  await fakeControl(`/__fake/stcourier/${awb}`, { status: "In Transit" });
  await login(page, world().admin.email);
  await expect(page).toHaveURL((url) => url.pathname === "/");
  await page.goto(`/admin/orders/${order.id}`);

  await page.getByLabel("Status", { exact: true }).selectOption("PROCESSING");
  await expect(page.getByText("Order updated").first()).toBeVisible();
  await expect.poll(async () => (await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("PROCESSING");

  await page.getByRole("button", { name: "Add tracking" }).click();
  await page.locator("#st-consignment").fill(awb);
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Tracking saved").first()).toBeVisible();
  await expect(page.getByText(awb).first()).toBeVisible();

  await page.getByRole("button", { name: /check now/i }).click();
  await expect(page.getByText("Tracking status updated").first()).toBeVisible();
  await expect(page.getByText(/in transit/i).first()).toBeVisible();

  page.once("dialog", (d) => {
    expect(d.message()).toBe("Refund this order and restore stock?");
    void d.accept();
  });
  await page.getByRole("button", { name: "Mark refunded" }).click();
  await expect(page.getByText("Order refunded").first()).toBeVisible();
  await expect
    .poll(async () => {
      const o = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
      return `${o.paymentStatus}/${o.status}`;
    })
    .toBe("REFUNDED/CANCELLED");
});
