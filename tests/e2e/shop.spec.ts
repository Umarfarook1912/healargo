import { expect, test } from "@playwright/test";
import { expectNotFound, expectOnLogin, prepare, world } from "./support";

test.beforeEach(async ({ page }) => prepare(page));

test("CAT-008 shop lists active products only", async ({ page }) => {
  const w = world();
  await page.goto("/shop");
  await expect(page.getByText(w.product.name).first()).toBeVisible();
  await expect(page.getByText(w.inactive.name)).toHaveCount(0);
});

test("PDP-001 price block", async ({ page }) => {
  const w = world();
  await page.goto(`/products/${w.product.slug}`);
  await expect(page.getByRole("heading", { name: w.product.name })).toBeVisible();
  await expect(page.getByText("₹350").first()).toBeVisible();
  await expect(page.getByText("₹400").first()).toBeVisible();
});

test("PDP-002 inactive product page is not served", async ({ page }) => {
  const res = await page.goto(`/products/${world().inactive.slug}`);
  await expectNotFound(res);
});

test("PDP-008 Buy Now as a guest asks to sign in", async ({ page }) => {
  await page.goto(`/products/${world().product.slug}`);
  // Retry the click: on a cold dev server it can land before hydration.
  await expect(async () => {
    await page.getByRole("button", { name: /buy now/i }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 3000 });
  }).toPass({ timeout: 60_000 });
  await expectOnLogin(page);
});
