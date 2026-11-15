import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { normalizeAttribution, sanitizePath, sanitizeToken } from "@/lib/attribution/parse";
import { attributionFromSearchParams, readStoredAttribution, visitFingerprint } from "@/lib/attribution/storage";
import { formatAttributionLine, formatConversionRate, formatSourceLabel } from "@/lib/attribution/labels";
import { ATTRIBUTION_STORAGE } from "@/constants/attribution";
import { renderEmailHtml } from "@/lib/email/template";
import { customerEmailFor, sendOrderStatusEmail } from "@/lib/email/send";

describe("attribution", () => {
  it("ANL-001 sanitizeToken", () => {
    expect(sanitizeToken(" Insta Gram!! ")).toBe("insta-gram");
    expect(sanitizeToken("---a---")).toBe("a");
    expect(sanitizeToken("a".repeat(200))).toHaveLength(120);
    expect(sanitizeToken("")).toBeUndefined();
  });

  it("ANL-002 sanitizePath", () => {
    expect(sanitizePath("/shop?x=1")).toBe("/shop");
    for (const p of ["shop", "/a b", "/<script>", `/${"a".repeat(200)}`]) expect(sanitizePath(p), p).toBeUndefined();
  });

  it("ANL-003 normalizeAttribution", () => {
    expect(normalizeAttribution({ landingPath: "/shop" })).toBeNull();
    expect(normalizeAttribution({ source: "YT" })).toMatchObject({ source: "yt" });
    expect(normalizeAttribution(null)).toBeNull();
  });

  it("ANL-004 search params and fingerprint", () => {
    const a = attributionFromSearchParams(new URLSearchParams("utm_source=yt&utm_medium=short"), "/")!;
    expect(a).toMatchObject({ source: "yt", medium: "short", landingPath: "/" });
    expect(visitFingerprint("sess", a)).toBe("sess|yt|short||||/");
  });

  describe("ANL-005 stored attribution TTL", () => {
    beforeEach(() => {
      (globalThis as { window?: unknown }).window = globalThis;
    });
    afterEach(() => {
      delete (globalThis as { window?: unknown }).window;
      localStorage.clear();
    });
    it("expires after 30 days", () => {
      const day = 24 * 60 * 60 * 1000;
      localStorage.setItem(ATTRIBUTION_STORAGE.key, JSON.stringify({ source: "ig", capturedAt: Date.now() - 29 * day }));
      expect(readStoredAttribution()).toMatchObject({ source: "ig" });
      localStorage.setItem(ATTRIBUTION_STORAGE.key, JSON.stringify({ source: "ig", capturedAt: Date.now() - 31 * day }));
      expect(readStoredAttribution()).toBeNull();
      expect(localStorage.getItem(ATTRIBUTION_STORAGE.key)).toBeNull();
    });
  });

  it("ANL-010 label helpers", () => {
    expect(formatSourceLabel("youtube")).toBe("YouTube");
    expect(formatSourceLabel("my_src")).toBe("My Src");
    expect(formatSourceLabel(undefined)).toBe("Direct");
    expect(formatConversionRate(0, 1)).toBe("—");
    expect(formatConversionRate(200, 3)).toBe("1.5%");
    expect(formatAttributionLine({ source: "youtube", campaign: "diwali" })).toBe("YouTube · diwali");
    expect(formatAttributionLine(null)).toBe("Direct");
  });
});

describe("emails", () => {
  it("ORD-014 HTML is escaped in every slot", () => {
    const evil = "<script>x</script>";
    const html = renderEmailHtml({ title: evil, greeting: evil, paragraphs: [evil], details: [{ label: evil, value: evil }] });
    expect(html).not.toContain("<script>x</script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("ORD-013 recipient falls back to the account email", () => {
    expect(customerEmailFor({ _id: "1", shippingAddress: { email: "ship@x.in" }, userId: { email: "acct@x.in" } } as never)).toBe("ship@x.in");
    expect(customerEmailFor({ _id: "1", shippingAddress: { email: " " }, userId: { email: "acct@x.in" } } as never)).toBe("acct@x.in");
    expect(customerEmailFor({ _id: "1", shippingAddress: {} } as never)).toBeUndefined();
  });

  it("ORD-015 status email content", async () => {
    const saved = { key: process.env.BREVO_API_KEY, from: process.env.EMAIL_FROM, url: process.env.BREVO_API_URL };
    process.env.BREVO_API_KEY = "test-key";
    process.env.EMAIL_FROM = "Healargo <orders@healargo.test>";
    delete process.env.BREVO_API_URL;
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ messageId: "m" }), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    try {
      await sendOrderStatusEmail({ _id: "abcdef1234", shippingAddress: { email: "c@x.in", fullName: "Anu" }, pricing: { total: 700 }, trackingNumber: "58240292331", courier: "ST Courier" } as never, "SHIPPED");
      const body = JSON.parse((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
      expect(body.htmlContent).toContain("ST Courier · 58240292331");
      expect(body.htmlContent).toContain("Estimated Delivery");
      await sendOrderStatusEmail({ _id: "abcdef1234", shippingAddress: { email: "c@x.in" }, pricing: { total: 700 } } as never, "DELIVERED");
      const body2 = JSON.parse((fetchMock.mock.calls[1] as unknown as [string, RequestInit])[1].body as string);
      expect(body2.htmlContent).not.toContain("Estimated Delivery");
    } finally {
      vi.unstubAllGlobals();
      for (const [k, v] of [["BREVO_API_KEY", saved.key], ["EMAIL_FROM", saved.from], ["BREVO_API_URL", saved.url]] as const) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
      }
    }
  });
});
