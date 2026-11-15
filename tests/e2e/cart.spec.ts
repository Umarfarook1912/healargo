import { expect, test } from "@playwright/test";
import { login, prepare, world } from "./support";

test.beforeEach(async ({ page }) => prepare(page));

const cartItems = (page: import("@playwright/test").Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem("healargo-cart") ?? "{}").state?.items ?? []);

test("PDP-006 out-of-stock variant disables purchase", async ({ page }) => {
  await page.goto(`/products/${world().product.slug}`);
  await expect(async () => {
    await page.getByRole("button", { name: "5L", exact: true }).click();
    await expect(page.getByRole("button", { name: /out of stock/i }).first()).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 60_000 });
  const add = page.getByRole("button", { name: /out of stock/i }).first();
  await expect(add).toBeDisabled();
  await expect(page.getByRole("button", { name: /buy now/i }).first()).toBeDisabled();
});

test("CART-008 cart page: quantity, subtotal, remove, empty state", async ({ page }) => {
  await page.goto(`/products/${world().product.slug}`);
  // A click before hydration is lost; click again only while the cart is empty.
  await expect(async () => {
    if ((await cartItems(page)).length === 0) {
      await page.getByRole("button", { name: /add to cart/i }).first().click();
    }
    expect(await cartItems(page)).toHaveLength(1);
  }).toPass({ timeout: 60_000 });
  await page.goto("/cart");
  await expect(page.getByText("Subtotal: ₹350")).toBeVisible();
  await page.locator('input[type="number"]').first().fill("3");
  await expect(page.getByText("Subtotal: ₹1,050")).toBeVisible();
  await page.getByRole("button", { name: "Remove" }).first().click();
  await expect(page.getByRole("heading", { name: /your cart is empty/i })).toBeVisible();
});

test("PDP-009 Buy Now when signed in replaces the cart and opens checkout", async ({ page }) => {
  const w = world();
  await login(page, w.customerA.email);
  await expect(page).toHaveURL((url) => url.pathname === "/");
  await page.evaluate(() =>
    localStorage.setItem(
      "healargo-cart",
      JSON.stringify({ state: { items: [{ productId: "other", variantId: "x", name: "Other", variantLabel: "1", price: 10, stock: 5, quantity: 2, image: "" }] }, version: 0 }),
    ),
  );
  await page.goto(`/products/${w.product.slug}`);
  // Retry the click: on a cold dev server it can land before hydration.
  await expect(async () => {
    await page.getByRole("button", { name: /buy now/i }).first().click();
    await expect(page).toHaveURL(/\/checkout/, { timeout: 3000 });
  }).toPass({ timeout: 60_000 });
  const items = await cartItems(page);
  expect(items).toHaveLength(1);
  expect(items[0].productId).toBe(w.product.id);
});
