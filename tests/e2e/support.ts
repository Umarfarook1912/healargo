import fs from "node:fs";
import path from "node:path";
import { expect, type Page, type Response } from "@playwright/test";
import { FAKE_SERVICES_URL } from "../helpers/env";
import { fakeCashfreeSdk } from "../helpers/fake-services";

export type World = {
  runId: string;
  password: string;
  customerA: { id: string; email: string };
  customerB: { id: string; email: string };
  admin: { id: string; email: string };
  product: { id: string; slug: string; name: string; variantIds: string[] };
  inactive: { id: string; slug: string; name: string };
  coupon: { code: string };
};

export function world(): World {
  return JSON.parse(fs.readFileSync(path.join(__dirname, ".auth", "world.json"), "utf8"));
}

/** Swap the real Cashfree SDK for the fake one and keep analytics offline. */
export async function prepare(page: Page) {
  await page.route("https://sdk.cashfree.com/**", (route) =>
    route.fulfill({ contentType: "application/javascript", body: fakeCashfreeSdk(FAKE_SERVICES_URL) }),
  );
  await page.route(/posthog|googletagmanager|google-analytics/, (route) => route.abort());
  // `next dev` draws its dev-tools badge in <nextjs-portal>, which can sit on
  // top of buttons and swallow clicks. Hide it (dev only; not in the app).
  await page.addInitScript(() => {
    const hide = () => {
      const style = document.createElement("style");
      style.textContent = "nextjs-portal{display:none!important}";
      document.head.appendChild(style);
    };
    if (document.head) hide();
    else document.addEventListener("DOMContentLoaded", hide);
  });
}

export async function login(page: Page, email: string, password = world().password, callbackUrl?: string) {
  await page.goto(callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: /^sign in$/i }).click();
}

export async function fakeControl(pathname: string, body?: unknown) {
  const res = await fetch(`${FAKE_SERVICES_URL}${pathname}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return res.json();
}

/**
 * notFound() pages. With a loading.tsx boundary Next streams them with HTTP
 * 200 (a "soft 404": the stream carries the NEXT_HTTP_ERROR_FALLBACK;404
 * marker and robots noindex), and the 404 view then auto-redirects to the
 * landing page, so check the response itself rather than the final page.
 * Returns the HTML so callers can check nothing private leaked.
 */
export async function expectNotFound(res: Response | null): Promise<string> {
  expect(res, "navigation response").not.toBeNull();
  const body = await res!.text();
  if (res!.status() === 404) return body;
  expect(body).toContain("NEXT_HTTP_ERROR_FALLBACK;404");
  expect(body).toMatch(/<meta name="robots" content="noindex/);
  return body;
}

export async function expectOnLogin(page: Page, callbackPath?: string) {
  await expect(page).toHaveURL(/\/login/);
  if (callbackPath) {
    const url = new URL(page.url());
    const cb = url.searchParams.get("callbackUrl") ?? "";
    expect(cb.endsWith(callbackPath)).toBe(true);
  }
}
