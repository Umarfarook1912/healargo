import { describe, expect, it } from "vitest";
import {
  comboIsLive,
  compareAtPrice,
  offerIsLive,
  sellingPrice,
  variantDisplayImage,
  variantIsAvailable,
} from "@/lib/products/commerce";
import { formatInr, slugify, stripHtml, truncate } from "@/lib/utils/format";
import { carouselSchema } from "@/lib/carousels/validation";
import { isValidPhone, isValidPincode } from "@/lib/validation/address";
import { comboSchema, productSchema, productUpdateSchema, uniqueSlug, zodErrorMessage } from "@/lib/catalog/validation";
import { couponCreateSchema, couponRuleError } from "@/lib/orders/coupon-validation";
import { productShareLinks } from "@/lib/products/share-links";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { buildCartWhatsAppMessage, buildWhatsAppUrl } from "@/lib/utils/whatsapp";
import robots from "@/app/robots";

const now = new Date("2026-11-15T12:00:00Z").getTime();
const at = (ms: number) => new Date(now + ms).toISOString();

describe("commerce helpers", () => {
  it("CAT-012 offerIsLive", () => {
    const window = { offerEnabled: true, offerStartsAt: at(-1000), offerEndsAt: at(1000) };
    expect(offerIsLive({ ...window, offerEnabled: false }, now)).toBe(false);
    expect(offerIsLive({ ...window, offerStartsAt: null }, now)).toBe(false);
    expect(offerIsLive({ ...window, offerEndsAt: null }, now)).toBe(false);
    expect(offerIsLive({ ...window, offerStartsAt: at(1) }, now)).toBe(false);
    expect(offerIsLive({ ...window, offerEndsAt: at(-1) }, now)).toBe(false);
    expect(offerIsLive({ ...window, offerStartsAt: at(0) }, now)).toBe(true);
    expect(offerIsLive({ ...window, offerEndsAt: at(0) }, now)).toBe(true);
    expect(offerIsLive({ ...window, offerStartsAt: "garbage" }, now)).toBe(false);
  });

  it("CAT-013 sellingPrice and compareAtPrice", () => {
    const live = { offerEnabled: true, offerStartsAt: new Date(Date.now() - 1e6), offerEndsAt: new Date(Date.now() + 1e6) };
    const v = { price: 500, originalPrice: 550, offerPrice: 420 };
    expect(sellingPrice(live, v)).toBe(420);
    expect(compareAtPrice(live, v)).toBe(500);
    expect(sellingPrice(live, { ...v, offerPrice: 0 })).toBe(500);
    expect(sellingPrice(live, { ...v, offerPrice: undefined })).toBe(500);
    expect(sellingPrice({}, v)).toBe(500);
    expect(compareAtPrice({}, v)).toBe(550);
  });

  it("CAT-014 variantIsAvailable", () => {
    expect(variantIsAvailable({ price: 1, originalPrice: 1, available: true, stock: 0 })).toBe(true);
    expect(variantIsAvailable({ price: 1, originalPrice: 1, available: false, stock: 5 })).toBe(false);
    expect(variantIsAvailable({ price: 1, originalPrice: 1, stock: 0 })).toBe(false);
    expect(variantIsAvailable({ price: 1, originalPrice: 1, stock: 3 })).toBe(true);
  });

  it("CAT-015 variantDisplayImage", () => {
    expect(variantDisplayImage(["p.jpg"], { image: "v.jpg" })).toBe("v.jpg");
    expect(variantDisplayImage(["", "a.jpg"], { image: "  " })).toBe("a.jpg");
    expect(variantDisplayImage([], null, "fallback.png")).toBe("fallback.png");
  });

  it("CMB-002 comboIsLive, including a single start or end date", () => {
    expect(comboIsLive({ isActive: false }, now)).toBe(false);
    expect(comboIsLive({ startsAt: at(-1000), endsAt: at(1000) }, now)).toBe(true);
    expect(comboIsLive({ startsAt: at(-2000), endsAt: at(-1000) }, now)).toBe(false);
    expect(comboIsLive({ startsAt: at(1000) }, now)).toBe(false);
    expect(comboIsLive({ endsAt: at(-1000) }, now)).toBe(false);
    expect(comboIsLive({ startsAt: at(-1000) }, now)).toBe(true);
    expect(comboIsLive({ startsAt: "garbage" }, now)).toBe(false);
    expect(comboIsLive({}, now)).toBe(true);
  });

  it("CAT-021 formatting utils", () => {
    expect(slugify("Sesame Oil (1L)!")).toBe("sesame-oil-1l");
    expect(stripHtml("<p>a</p> b")).toBe("a b");
    expect(formatInr(1234.5)).toMatch(/₹\s?1,234\.5/);
    const long = "x".repeat(200);
    const cut = truncate(long, 10);
    expect(cut.length).toBeLessThanOrEqual(11);
    expect(truncate("short", 10)).toBe("short");
  });
});

describe("validation schemas", () => {
  it("ADM-CAR-001 carouselSchema", () => {
    const base = { imageUrl: "/banner.png", navigationLink: "/shop" };
    const ok = (o: Record<string, unknown>) => carouselSchema.safeParse({ ...base, ...o }).success;
    expect([ok({}), ok({ imageUrl: "https://x/y.jpg" }), ok({ imageUrl: "ftp://x" }), ok({ imageUrl: "" })]).toEqual([true, true, false, false]);
    expect(
      ["/shop", "https://x", "javascript:alert(1)", "JavaScript:alert(1)", "data:text/html,x", "vbscript:x"].map((navigationLink) => ok({ navigationLink })),
    ).toEqual([true, true, false, false, false, false]);
    const coerced = carouselSchema.safeParse({ ...base, sortOrder: "2" });
    expect(coerced.success && coerced.data.sortOrder).toBe(2);
    expect(ok({ sortOrder: 0 })).toBe(false);
    expect(ok({ sortOrder: 1.5 })).toBe(false);
  });

  it("CHK-006 phone and PIN validators", () => {
    for (const p of ["9876543210", "+91 98765 43210", "098765-43210", "(987) 654-3210"]) expect(isValidPhone(p), p).toBe(true);
    for (const p of ["12345", "98765432101234", "abcdefghij", ""]) expect(isValidPhone(p), p).toBe(false);
    expect(isValidPincode("600001")).toBe(true);
    for (const p of ["060001", "60001", "6000011", "6OOOO1"]) expect(isValidPincode(p), p).toBe(false);
  });

  it("ADM-PRD-004 product schema rejects negative prices and stock; update strips unknown keys", () => {
    const product = {
      name: "Oil",
      description: "<p>Good oil</p>",
      categoryId: "c1",
      variants: [{ label: "1L", sku: "s", originalPrice: 10, price: 9, stock: 1 }],
    };
    expect(productSchema.safeParse(product).success).toBe(true);
    expect(productSchema.safeParse({ ...product, variants: [{ ...product.variants[0], price: -1 }] }).success).toBe(false);
    expect(productSchema.safeParse({ ...product, variants: [{ ...product.variants[0], stock: -1 }] }).success).toBe(false);
    expect(productSchema.safeParse({ ...product, variants: [{ ...product.variants[0], stock: 1.5 }] }).success).toBe(false);
    const upd = productUpdateSchema.parse({ averageRating: 5, reviewCount: 9, name: "New" });
    expect(upd).toEqual({ name: "New" });
  });

  it("ADM-CMB-002 combo schema messages", () => {
    const res = comboSchema.safeParse({ name: "Pack", price: 0, originalPrice: 1, items: [{ productName: "Spoon", isCustom: true }] });
    expect(res.success).toBe(false);
    if (!res.success) expect(zodErrorMessage(res.error)).toContain("price: Combo price must be greater than 0");
  });

  it("ADM-CPN-005 coupon rules", () => {
    expect(couponRuleError({ discountType: "PERCENTAGE", discountValue: 150, validFrom: "2026-01-01", validTo: "2026-02-01" })).toMatch(/100/);
    expect(couponRuleError({ discountType: "FIXED", discountValue: 150, validFrom: "2026-01-01", validTo: "2026-02-01" })).toBeNull();
    expect(couponRuleError({ discountType: "FIXED", discountValue: 1, validFrom: "2026-02-01", validTo: "2026-01-01" })).toMatch(/after/);
    expect(couponCreateSchema.safeParse({ code: "AB", name: "AB", discountValue: 1, validFrom: "not-a-date", validTo: "2026-01-01" }).success).toBe(false);
  });

  it("uniqueSlug adds a numeric suffix", async () => {
    const taken = new Set(["oil", "oil-2"]);
    expect(await uniqueSlug("oil", async (s) => taken.has(s))).toBe("oil-3");
    expect(await uniqueSlug("ghee", async (s) => taken.has(s))).toBe("ghee");
  });
});

describe("share, SEO and WhatsApp helpers", () => {
  it("PDP-013 share links are encoded", () => {
    const links = productShareLinks("Sesame & Oil", "https://healargo.test/products/sesame?x=1&y=2");
    const fb = links.find((l) => l.key === "facebook")!;
    expect(fb.href).toContain(encodeURIComponent("https://healargo.test/products/sesame?x=1&y=2"));
    for (const l of links) expect(l.href).not.toContain(" ");
  });

  it("SEO-002 robots disallow private areas", () => {
    const r = robots();
    const rules = Array.isArray(r.rules) ? r.rules[0] : r.rules;
    expect(rules.disallow).toEqual(["/admin", "/admin/", "/api/", "/cart", "/checkout", "/orders", "/profile", "/login", "/register"]);
    expect(String(r.sitemap)).toMatch(/\/sitemap\.xml$/);
  });

  it("SEO-003 page metadata", () => {
    const m = buildPageMetadata({ title: "Shop", path: "/shop" });
    expect(String(m.alternates?.canonical)).toMatch(/\/shop$/);
    expect(JSON.stringify(m.openGraph)).toMatch(/logo|\.png|\.svg|\.webp/i);
  });

  it("CART-013 cart WhatsApp message", () => {
    const items = [
      { productId: "p", variantId: "v", name: "Sesame Oil", variantLabel: "1L", price: 350, quantity: 2, stock: 5, image: "" },
      { productId: "q", variantId: "w", name: "Ghee", variantLabel: "500g", price: 600, quantity: 1, stock: 5, image: "" },
    ];
    const msg = buildCartWhatsAppMessage(items as never, 1300);
    expect(msg).toContain("Sesame Oil (1L) × 2 — ₹700");
    expect(msg).toContain("Ghee (500g) × 1 — ₹600");
    expect(msg).toContain("Total: ₹1300");
    const url = buildWhatsAppUrl(msg);
    expect(url).toMatch(/^https:\/\/wa\.me\/\d+\?text=/);
    expect(decodeURIComponent(url.split("text=")[1])).toBe(msg);
  });
});
