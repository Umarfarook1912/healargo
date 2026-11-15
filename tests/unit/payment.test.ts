import crypto from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { verifyCashfreeWebhookSignature } from "@/lib/payment/webhook-auth";
import { resolveSiteUrl } from "@/lib/payment/site-url";
import { getCashfreeCredentials, getCashfreeHost, getCashfreeMode } from "@/lib/payment/cashfree-auth";
import { createCashfreePayment, getCashfreeOrderStatus } from "@/lib/payment/cashfree";
import { orderIdSuffixFromCashfreeId } from "@/lib/payment/order-sync";

const ENV_KEYS = ["CASHFREE_ENV", "CASHFREE_BASE_URL", "CASHFREE_APP_ID", "CASHFREE_SECRET_KEY", "CASHFREE_API_VERSION", "NEXT_PUBLIC_SITE_URL", "NODE_ENV"];
let saved: Record<string, string | undefined> = {};
beforeEach(() => {
  saved = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  process.env.CASHFREE_APP_ID = "app";
  process.env.CASHFREE_SECRET_KEY = "secret";
  delete process.env.CASHFREE_BASE_URL;
  delete process.env.CASHFREE_ENV;
});
afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
  vi.unstubAllGlobals();
});

function signed(body: string, opts: { secret?: string; ts?: string; sig?: string; headers?: boolean } = {}) {
  const ts = opts.ts ?? "1700000000";
  const sig = opts.sig ?? crypto.createHmac("sha256", opts.secret ?? "secret").update(ts + body).digest("base64");
  const headers: Record<string, string> = opts.headers === false ? {} : { "x-webhook-signature": sig, "x-webhook-timestamp": ts };
  return new Request("http://x/api", { method: "POST", headers, body });
}

describe("PAY-015 webhook signature", () => {
  const body = '{"type":"PAYMENT_SUCCESS_WEBHOOK"}';
  it("accepts a valid signature", () => {
    expect(verifyCashfreeWebhookSignature(signed(body), body)).toEqual({ ok: true });
  });
  it.each([
    ["body changed", () => verifyCashfreeWebhookSignature(signed(body), body.replace("}", " }"))],
    ["different timestamp", () => {
      const r = signed(body);
      const h = new Headers(r.headers);
      h.set("x-webhook-timestamp", "1700000001");
      return verifyCashfreeWebhookSignature(new Request("http://x", { method: "POST", headers: h, body }), body);
    }],
    ["wrong secret", () => verifyCashfreeWebhookSignature(signed(body, { secret: "other" }), body)],
    ["missing headers", () => verifyCashfreeWebhookSignature(signed(body, { headers: false }), body)],
    ["different length", () => verifyCashfreeWebhookSignature(signed(body, { sig: "abc" }), body)],
    ["empty secret env", () => {
      process.env.CASHFREE_SECRET_KEY = "";
      return verifyCashfreeWebhookSignature(signed(body), body);
    }],
  ])("rejects %s without throwing", (_l, run) => {
    const res = run();
    expect(res.ok).toBe(false);
  });
});

describe("PAY-008 resolveSiteUrl", () => {
  const req = (headers: Record<string, string>) => new Request("http://ignored/", { headers });
  it("uses request headers outside production", () => {
    vi.stubEnv("NODE_ENV", "test");
    expect(resolveSiteUrl(req({ "x-forwarded-host": "fwd.example", "x-forwarded-proto": "https" }))).toBe("https://fwd.example");
    expect(resolveSiteUrl(req({ host: "abc.ngrok-free.app" }))).toBe("https://abc.ngrok-free.app");
    expect(resolveSiteUrl(req({ host: "localhost:3000" }))).toBe("http://localhost:3000");
    vi.unstubAllEnvs();
  });
  it("in production trusts only the configured host (www-insensitive)", () => {
    vi.stubEnv("NODE_ENV", "production");
    process.env.NEXT_PUBLIC_SITE_URL = "https://healargo.com/";
    expect(resolveSiteUrl(req({ host: "evil.example", "x-forwarded-proto": "https" }))).toBe("https://healargo.com");
    expect(resolveSiteUrl(req({ host: "www.healargo.com", "x-forwarded-proto": "https" }))).toBe("https://www.healargo.com");
    vi.unstubAllEnvs();
  });
});

describe("PAY-009 env helpers", () => {
  it.each([
    ["production", "production"],
    ["PRODUCTION", "production"],
    [undefined, "sandbox"],
    ["junk", "sandbox"],
  ])("CASHFREE_ENV=%s gives %s", (env, mode) => {
    if (env === undefined) delete process.env.CASHFREE_ENV;
    else process.env.CASHFREE_ENV = env;
    expect(getCashfreeMode()).toBe(mode);
    expect(getCashfreeHost()).toBe(mode === "production" ? "https://api.cashfree.com" : "https://sandbox.cashfree.com");
  });

  it("API version defaults to 2023-08-01", () => {
    delete process.env.CASHFREE_API_VERSION;
    expect(getCashfreeCredentials().apiVersion).toBe("2023-08-01");
  });

  it("CASHFREE_BASE_URL is a sandbox-only override", () => {
    process.env.CASHFREE_BASE_URL = "http://127.0.0.1:4599/";
    expect(getCashfreeHost()).toBe("http://127.0.0.1:4599");
    process.env.CASHFREE_ENV = "PRODUCTION";
    expect(getCashfreeHost()).toBe("https://api.cashfree.com");
  });
});

describe("Cashfree API client (stubbed fetch)", () => {
  const input = { orderId: "HG-1", amountInr: 100, customerId: "c", customerPhone: "+91 98765 43210", returnUrl: "r", notifyUrl: "n" };
  const reply = (status: number, body: unknown) => vi.fn(async () => new Response(JSON.stringify(body), { status }));

  it("PAY-010 createCashfreePayment error mapping", async () => {
    vi.stubGlobal("fetch", reply(400, { error: { message: "A" }, message: "B", code: "C" }));
    expect(await createCashfreePayment(input)).toMatchObject({ error: "A" });
    vi.stubGlobal("fetch", reply(400, { message: "B", code: "C" }));
    expect(await createCashfreePayment(input)).toMatchObject({ error: "B" });
    vi.stubGlobal("fetch", reply(400, { code: "C" }));
    expect(await createCashfreePayment(input)).toMatchObject({ error: "C" });
    vi.stubGlobal("fetch", reply(200, { order_id: "HG-1" }));
    expect(await createCashfreePayment(input)).toMatchObject({ error: "Payment initiation failed" });
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("network down"); }));
    expect(await createCashfreePayment(input)).toMatchObject({ error: "network down" });
  });

  it("PAY-010 sends the last 10 phone digits and the amount", async () => {
    const f = reply(200, { order_id: "HG-1", payment_session_id: "sess" });
    vi.stubGlobal("fetch", f);
    expect(await createCashfreePayment(input)).toMatchObject({ paymentSessionId: "sess", cashfreeOrderId: "HG-1", mode: "sandbox" });
    const body = JSON.parse((f.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(body.customer_details.customer_phone).toBe("9876543210");
    expect(body.order_amount).toBe(100);
  });

  it("PAY-011 getCashfreeOrderStatus", async () => {
    vi.stubGlobal("fetch", reply(200, { order_status: "PAID", cf_order_id: 77 }));
    expect(await getCashfreeOrderStatus("HG-1")).toMatchObject({ success: true, state: "PAID", paymentId: "77" });
    vi.stubGlobal("fetch", reply(200, { order_status: "ACTIVE", payment_session_id: "s" }));
    expect(await getCashfreeOrderStatus("HG-1")).toMatchObject({ success: false, state: "ACTIVE", paymentSessionId: "s" });
    vi.stubGlobal("fetch", reply(404, { message: "not found" }));
    expect(await getCashfreeOrderStatus("HG-1")).toMatchObject({ success: false, state: "ERROR" });
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("x"); }));
    expect(await getCashfreeOrderStatus("HG-1")).toMatchObject({ success: false, state: "ERROR" });
  });
});

describe("Cashfree order id parsing", () => {
  it.each([
    ["HG-ABCDEF12-123456", "ABCDEF12"],
    ["HG-abc123-000001", "abc123"],
    ["HG-ABC-123456", null],
    ["XX-ABCDEF12-123456", null],
    ["HG-ABCDEF12-12345", null],
  ])("%s -> %s", (id, suffix) => {
    expect(orderIdSuffixFromCashfreeId(id)).toBe(suffix);
  });
});
