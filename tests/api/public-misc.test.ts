import { beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import * as contact from "@/app/api/contact/route";
import * as visits from "@/app/api/analytics/visits/route";
import * as clicks from "@/app/api/analytics/whatsapp-clicks/route";
import * as highlights from "@/app/api/catalog/highlights/route";
import { getProducts, getProductBySlug, getCategoryBySlug } from "@/lib/products/queries";
import { getComboBySlug } from "@/lib/catalog/get-combo";
import { getLiveOffers } from "@/lib/catalog/highlights";
import { getDeliveredReviewTargets } from "@/lib/reviews/order-reviews";
import { getTrafficReport } from "@/lib/attribution/report";
import sitemap from "@/app/sitemap";
import { createStdWorld, type StdWorld } from "../fixtures/world";
import { createCombo, createOrder, createProduct } from "../fixtures/factory";
import { RUN_ID, testEmail, uid } from "../fixtures/run";
import { call, settle } from "../helpers/http";
import { actAs } from "../helpers/session";
import { fake } from "../helpers/fake";

let w: StdWorld;
beforeAll(async () => {
  w = await createStdWorld();
});

let ipCounter = 0;
const ip = () => `10.${(ipCounter >> 8) & 255}.${ipCounter++ & 255}.7`;
const message = (o: Record<string, unknown> = {}) => ({
  name: "  Priya Raman ",
  email: testEmail("contact").toUpperCase(),
  phone: "9876543210",
  message: `Do you ship to Madurai? ${RUN_ID}`,
  startedAt: Date.now() - 5000,
  ...o,
});
const sentTo = () => fake().state.emails.filter((e) => e.to === process.env.ADMIN_NOTIFY_EMAIL);

describe("contact form (POST /api/contact)", () => {
  it("CON-001 valid message is emailed trimmed and lower-cased", async () => {
    const body = message();
    const res = await call(contact.POST, { body, headers: { "x-forwarded-for": ip() } });
    expect(res.status).toBe(200);
    expect(res.json.data.ok).toBe(true);
    await settle();
    const mail = sentTo().at(-1)!;
    expect(mail.text).toContain("Name: Priya Raman\n");
    expect(mail.replyTo).toBe(body.email.trim().toLowerCase());
  });

  it.each([
    ["name 1 char", { name: "P" }],
    ["name 101 chars", { name: "P".repeat(101) }],
    ["bad email", { email: "nope" }],
    ["message 9 chars", { message: "123456789" }],
    ["message 2001 chars", { message: "a".repeat(2001) }],
    ["phone 21 chars", { phone: "1".repeat(21) }],
  ])("CON-002 rejects %s", async (_l, patch) => {
    expect((await call(contact.POST, { body: message(patch), headers: { "x-forwarded-for": ip() } })).status).toBe(400);
  });

  it.each([
    ["honeypot (CON-003)", { website: "http://spam" }],
    ["no startedAt (CON-004)", { startedAt: undefined }],
    // A function, so "1 s ago" is computed when the test runs, not when the
    // file is collected (on a slow DB the world setup takes longer than 3 s).
    ["filled in 1 s (CON-004)", () => ({ startedAt: Date.now() - 1000 })],
    ["random-token name (CON-005)", { name: "gKzyAVwNDARbWPeSpHZl" }],
    ["digits-only message (CON-005)", { message: "98765 43210 123" }],
    ["no letters (CON-005)", { message: "!!!!!!!!!!!!" }],
    ["dotted gmail (CON-005)", { email: "a.b.c.d@gmail.com" }],
  ])("spam is answered with a fake ok and no email: %s", async (_l, patch) => {
    const body = message(typeof patch === "function" ? patch() : patch);
    const res = await call(contact.POST, { body, headers: { "x-forwarded-for": ip() } });
    expect(res.status).toBe(200);
    expect(res.json.data.ok).toBe(true);
    await settle();
    expect(sentTo()).toHaveLength(0);
  });

  it("CON-005 a Tamil message is sent", async () => {
    await call(contact.POST, { body: message({ message: "வணக்கம், எண்ணெய் விலை என்ன?" }), headers: { "x-forwarded-for": ip() } });
    await settle();
    expect(sentTo()).toHaveLength(1);
  });

  it("CON-006 rate limit is 3 per hour per IP", async () => {
    const addr = ip();
    const statuses = [];
    for (let i = 0; i < 4; i += 1) {
      statuses.push((await call(contact.POST, { body: message(), headers: { "x-forwarded-for": addr } })).status);
    }
    expect(statuses).toEqual([200, 200, 200, 429]);
    expect((await call(contact.POST, { body: message(), headers: { "x-forwarded-for": ip() } })).status).toBe(200);
  });

  it("CON-007 email failure is a 500", async () => {
    const saved = process.env.BREVO_API_URL;
    process.env.BREVO_API_URL = "http://127.0.0.1:1/v3/smtp/email";
    try {
      const res = await call(contact.POST, { body: message(), headers: { "x-forwarded-for": ip() } });
      expect(res.status).toBe(500);
      expect(typeof res.json.error).toBe("string");
    } finally {
      process.env.BREVO_API_URL = saved;
    }
  });
});

describe("analytics endpoints", () => {
  it("ANL-006 visits: create, validation, duplicates, per-session limit", async () => {
    const sessionKey = `${RUN_ID}vis${uid("s").replace(/\W/g, "")}`.slice(0, 60);
    const visit = { sessionKey, source: "instagram", campaign: RUN_ID, landingPath: "/shop" };
    expect((await call(visits.POST, { body: visit })).status).toBe(200);
    expect((await call(visits.POST, { body: { ...visit, sessionKey: "1234567" } })).status).toBe(400);
    expect((await call(visits.POST, { body: { sessionKey } })).status).toBe(400);
    expect((await call(visits.POST, { body: visit })).status).toBe(200);
    expect(await prisma.marketingVisit.count({ where: { sessionKey } })).toBe(1);
    // Fill the session up to one below the limit in one round trip, then the
    // endpoint takes the 30th visit and ignores the 31st.
    await prisma.marketingVisit.createMany({
      data: Array.from({ length: 28 }, (_, i) => ({ sessionKey, source: "instagram", campaign: RUN_ID, content: `seed${i}` })),
    });
    expect(await prisma.marketingVisit.count({ where: { sessionKey } })).toBe(29);
    for (const content of ["c30", "c31"]) {
      expect((await call(visits.POST, { body: { ...visit, content } })).status).toBe(200);
    }
    expect(await prisma.marketingVisit.count({ where: { sessionKey } })).toBe(30);
  });

  it("ANL-007 WhatsApp clicks", async () => {
    const sessionKey = `${RUN_ID}wa${Date.now().toString(36)}`;
    const click = (o: Record<string, unknown> = {}) => ({
      context: "product",
      pagePath: `/products/${RUN_ID}`,
      items: [{ productId: w.pSesame.id, name: "Sesame", variantLabel: "1L", quantity: 1, price: 350 }],
      estimatedTotal: 350,
      sessionKey,
      ...o,
    });
    actAs(null);
    expect((await call(clicks.POST, { body: click() })).status).toBe(200);
    actAs(w.customerA);
    expect((await call(clicks.POST, { body: click() })).status).toBe(200);
    const rows = await prisma.whatsAppClick.findMany({ where: { sessionKey }, orderBy: { createdAt: "asc" } });
    expect(rows[0]).toMatchObject({ status: "NEW", userId: null });
    expect(rows[1]).toMatchObject({ userId: w.customerA.id, userEmail: w.customerA.email });
    expect((await call(clicks.POST, { body: click({ context: "home" }) })).status).toBe(400);
    expect((await call(clicks.POST, { body: click({ items: [] }) })).status).toBe(400);
    expect((await call(clicks.POST, { body: click({ items: [{ name: "x", quantity: 1000, price: 1 }] }) })).status).toBe(400);
    // Two clicks exist; seed 37 more in one round trip, then the endpoint
    // takes the 40th and silently ignores the 41st.
    await prisma.whatsAppClick.createMany({
      data: Array.from({ length: 37 }, () => ({
        context: "product" as const,
        pagePath: `/products/${RUN_ID}`,
        items: [],
        estimatedTotal: 0,
        sessionKey,
      })),
    });
    for (let i = 0; i < 2; i += 1) {
      expect((await call(clicks.POST, { body: click() })).status).toBe(200);
    }
    expect(await prisma.whatsAppClick.count({ where: { sessionKey } })).toBe(40);
  });

  it("ANL-011 traffic report aggregates per source with PAID revenue only", async () => {
    const source = `src${RUN_ID}`.slice(0, 40);
    await prisma.marketingVisit.createMany({
      data: [1, 2].map((i) => ({ source, campaign: RUN_ID, sessionKey: `${RUN_ID}tr${i}` })),
    });
    const paid = await createOrder({ paymentStatus: "PAID", status: "CONFIRMED", total: 500, items: [{ productId: w.pSesame.id, variantId: w.v1L, quantity: 1, price: 500 }] });
    const pending = await createOrder({ items: [{ productId: w.pSesame.id, variantId: w.v1L, quantity: 1 }] });
    for (const o of [paid, pending]) {
      await prisma.order.update({ where: { id: o.id }, data: { attribution: { source, campaign: RUN_ID } } });
    }
    const report = await getTrafficReport();
    const row = report.sources.find((s) => s.source === source)!;
    expect(row).toMatchObject({ visits: 2, orders: 2, paidOrders: 1, revenue: 500 });
  });
});

describe("catalog queries", () => {
  it("CAT-006 + CAT-007 category slug matching", async () => {
    const slug = `${RUN_ID}-wood-pressed-oils`;
    const cat = await prisma.category.create({ data: { name: `Wood ${RUN_ID}`, slug, sortOrder: 990 } });
    const hidden = await prisma.category.create({ data: { name: `Hidden ${RUN_ID}`, slug: `${RUN_ID}-hidden-cat`, isActive: false } });
    // A shorter slug contained in ours, sorted first: it used to capture the
    // lookup (live data has e.g. "oils" next to "wood-pressed-oils").
    await prisma.category.create({ data: { name: `Short ${RUN_ID}`, slug: `${RUN_ID}-wood`, sortOrder: -100 } });
    const p = await createProduct({ categoryId: cat.id });
    for (const s of [slug, slug.toUpperCase().replace(/-/g, "_"), `${RUN_ID}woodpressed`]) {
      expect((await getProducts({ categorySlug: s })).map((x) => x._id)).toEqual([p.id]);
      expect((await getCategoryBySlug(s))?._id).toBe(cat.id);
    }
    expect(await getProducts({ categorySlug: `${RUN_ID}-unknown` })).toEqual([]);
    expect(await getProducts({ categorySlug: hidden.slug })).toEqual([]);
    expect(await getCategoryBySlug(hidden.slug)).toBeNull();
  });

  it("CAT-011 live offers include running offers only", async () => {
    const ids = (await getLiveOffers()).map((p) => p._id);
    expect(ids).toContain(w.pOffer.id);
    expect(ids).not.toContain(w.pOfferExpired.id);
  });

  it("CAT-017 highlights endpoint", async () => {
    const res = await call(highlights.GET);
    expect(res.status).toBe(200);
    expect(res.json.data).toEqual({ hasOffers: true, hasCombos: true });
  });

  it("PDP-002 + PDP-003 slug lookup: case-insensitive, no fuzzy matches", async () => {
    expect((await getProductBySlug(w.pSesame.slug.toUpperCase()))?._id).toBe(w.pSesame.id);
    expect((await getProductBySlug(w.pSesame.slug.replace(/-/g, "_")))?._id).toBe(w.pSesame.id);
    expect(await getProductBySlug(`best-${w.pSesame.slug}-thing`)).toBeNull();
    expect(await getProductBySlug(w.pInactive.slug)).toBeNull();
  });

  it("CMB-006 combo detail: custom lines and missing products", async () => {
    const c = await createCombo({
      items: [
        { productId: w.pSesame.id, variantId: w.v1L, quantity: 2 },
        { isCustom: true, productName: "Gift box", customPrice: 50 },
        { productId: "00000000-0000-4000-8000-000000000000", variantId: "gone", quantity: 1, productName: "Old item" },
      ],
    });
    const detail = await getComboBySlug(c.slug);
    expect(detail).not.toBeNull();
    expect(detail!.lines).toHaveLength(3);
    expect(detail!.lines[1]).toMatchObject({ name: "Gift box", unitPrice: 50 });
    expect(detail!.lines[2]).toMatchObject({ name: "Old item" });
    expect(await getComboBySlug(`${c.slug}-typo`)).toBeNull();
    expect(await getComboBySlug(w.comboExpired.slug)).toBeNull();
  });

  it("ORD-011 review targets are deduped and skip deleted products", async () => {
    const p = await createProduct({ categoryId: w.catOils.id });
    await prisma.review.create({ data: { productId: w.pSesame.id, userId: w.customerB.id, authorName: `R ${RUN_ID}`, rating: 5, body: "Lovely" } });
    const result = await getDeliveredReviewTargets(w.customerB.id, [
      { productId: w.pSesame.id, name: "Sesame" },
      { productId: w.pSesame.id, name: "Sesame again" },
      { productId: p.id, name: "Other" },
      { productId: "00000000-0000-4000-8000-000000000000", name: "Deleted" },
    ]);
    expect(result.items.map((i) => i.productId)).toEqual([w.pSesame.id, p.id]);
    expect(result.reviewedIds).toEqual([w.pSesame.id]);
  });

  it("SEO-001 sitemap lists active products and categories only", async () => {
    const entries = await sitemap();
    const urls = entries.map((e) => e.url);
    expect(urls.some((u) => u.endsWith(w.pSesame.slug))).toBe(true);
    expect(urls.some((u) => u.endsWith(w.pInactive.slug))).toBe(false);
    expect(urls.some((u) => u.endsWith(w.catOils.slug))).toBe(true);
    expect(urls.some((u) => u.endsWith(w.catHidden.slug))).toBe(false);
  });
});
