import { expect, test } from "@playwright/test";
import { expectOnLogin, login, prepare, world } from "./support";

test.beforeEach(async ({ page }) => prepare(page));

test("AUTH-032 anonymous users are sent to login from protected pages", async ({ page }) => {
  for (const path of ["/checkout", "/profile", "/orders"]) {
    await page.goto(path);
    await expectOnLogin(page, path);
  }
});

test("AUTH-007 wrong password stays on login", async ({ page }) => {
  await login(page, world().customerA.email, "wrong-password");
  await expect(page.getByText(/invalid email or password/i).first()).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});

test("AUTH-006 + AUTH-038 login returns to the callbackUrl", async ({ page }) => {
  await login(page, world().customerA.email, undefined, "/profile");
  await expect(page).toHaveURL(/\/profile/);
});

test("AUTH-006 login without callbackUrl lands on home", async ({ page }) => {
  await login(page, world().customerA.email);
  await expect(page).toHaveURL((url) => url.pathname === "/");
});

test("AUTH-033 customers cannot open admin pages", async ({ page }) => {
  await login(page, world().customerA.email);
  await expect(page).toHaveURL((url) => url.pathname === "/");
  for (const path of ["/admin", "/admin/orders", "/admin/users"]) {
    await page.goto(path);
    // Middleware sends them to /login, which sends a signed-in user home.
    await expect(page).not.toHaveURL(/\/admin/);
    await expect(page.getByRole("heading", { name: /dashboard|orders|users/i })).toHaveCount(0);
  }
});

test("AUTH-008 unknown email gets the same generic error", async ({ page }) => {
  await login(page, `nobody-${world().runId}@healargo.test`, "whatever-123");
  await expect(page.getByText(/invalid email or password/i).first()).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});

test("AUTH-009 login email is case-insensitive", async ({ page }) => {
  await login(page, world().customerA.email.toUpperCase());
  await expect(page).toHaveURL((url) => url.pathname === "/");
});

test("AUTH-011 a signed-in user opening /login goes home", async ({ page }) => {
  await login(page, world().customerA.email);
  await expect(page).toHaveURL((url) => url.pathname === "/");
  await page.goto("/login");
  await expect(page).toHaveURL((url) => url.pathname === "/");
});

test("CHK-001 empty cart at checkout", async ({ page }) => {
  await login(page, world().customerA.email);
  await expect(page).toHaveURL((url) => url.pathname === "/");
  await page.evaluate(() => localStorage.removeItem("healargo-cart"));
  await page.goto("/checkout");
  await expect(page.getByText("Your cart is empty").first()).toBeVisible();
});
