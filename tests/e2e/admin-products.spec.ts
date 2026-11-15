import { expect, test } from "@playwright/test";
import { prisma } from "@/lib/db/prisma";
import { login, prepare, world } from "./support";

test.beforeEach(async ({ page }) => prepare(page));
test.afterAll(async () => prisma.$disconnect());

test("ADM-PRD-011 create a product through the admin UI; it shows on /shop and its PDP", async ({ page }) => {
  const w = world();
  const { categoryId } = await prisma.product.findUniqueOrThrow({ where: { id: w.product.id } });
  const name = `UI Oil ${w.runId}`;

  await login(page, w.admin.email);
  await expect(page).toHaveURL((url) => url.pathname === "/");
  await page.goto("/admin/products/new");

  await page.locator("#name").fill(name);
  await page.locator("#categoryId").selectOption(categoryId);
  await page.locator("#shortDescription").fill("Made by the UI test");
  const editor = page.locator('[contenteditable="true"]').first();
  await editor.click();
  await editor.pressSequentially("Pressed slowly in wood.");
  await page.getByPlaceholder(/paste image url/i).fill("https://example.test/ui-oil.jpg");

  const rows = page.locator('div[class*="sm:grid-cols-12"]', { has: page.getByPlaceholder("e.g. 1L Bottle") });
  // The first click after typing into the image box can be eaten by its blur
  // re-render, so click until the second row shows (never past two).
  await expect(async () => {
    if ((await rows.count()) < 2) await page.getByRole("button", { name: "+ 5L Can" }).click();
    await expect(rows).toHaveCount(2, { timeout: 2000 });
  }).toPass({ timeout: 20_000 });
  const prices = [
    { original: "500", sale: "450" },
    { original: "2000", sale: "1800" },
  ];
  for (const [i, p] of prices.entries()) {
    const nums = rows.nth(i).locator('input[type="number"]');
    await nums.nth(0).fill(p.original);
    await nums.nth(1).fill(p.sale);
  }

  await page.getByRole("button", { name: "Create Product" }).click();
  await expect(page.getByText("Product created successfully").first()).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/products(\?|$)/);

  const created = await prisma.product.findFirstOrThrow({ where: { name } });
  const variants = created.variants as { label: string; originalPrice: number; price: number }[];
  expect(created.slug).toContain(w.runId);
  expect(created.description).toContain("Pressed slowly in wood.");
  expect(created.images).toEqual(["https://example.test/ui-oil.jpg"]);
  expect(variants.map((v) => [v.label, v.originalPrice, v.price])).toEqual([
    ["1L Bottle", 500, 450],
    ["5L Can", 2000, 1800],
  ]);

  await page.goto("/admin/products");
  await expect(page.getByText(name).first()).toBeVisible();
  await page.goto("/shop");
  await expect(page.getByText(name).first()).toBeVisible();
  await page.goto(`/products/${created.slug}`);
  await expect(page.getByRole("heading", { name })).toBeVisible();
  await expect(page.getByText("₹450").first()).toBeVisible();
});
