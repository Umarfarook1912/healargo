import { vi } from "vitest";
import { beforeAll, describe, expect, it } from "vitest";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import * as products from "@/app/api/products/route";
import * as productById from "@/app/api/products/[id]/route";
import * as categories from "@/app/api/categories/route";
import * as categoryById from "@/app/api/categories/[id]/route";
import * as combos from "@/app/api/combos/route";
import * as comboById from "@/app/api/combos/[id]/route";
import * as carousels from "@/app/api/carousels/route";
import * as carouselById from "@/app/api/carousels/[id]/route";
import * as carouselStatus from "@/app/api/carousels/[id]/status/route";
import * as carouselPublic from "@/app/api/carousels/public/route";
import * as coupons from "@/app/api/admin/coupons/route";
import * as couponById from "@/app/api/admin/coupons/[id]/route";
import * as adminOrders from "@/app/api/admin/orders/route";
import * as adminOrderById from "@/app/api/admin/orders/[id]/route";
import * as refund from "@/app/api/admin/orders/[id]/refund/route";
import * as tracking from "@/app/api/admin/orders/[id]/tracking/route";
import * as trackingSync from "@/app/api/admin/orders/[id]/tracking/sync/route";
import * as adminTracking from "@/app/api/admin/tracking/route";
import * as users from "@/app/api/admin/users/route";
import * as userById from "@/app/api/admin/users/[id]/route";
import * as usersExport from "@/app/api/admin/users/export/route";
import * as ordersExport from "@/app/api/admin/orders/export/route";
import * as productsExport from "@/app/api/admin/products/export/route";
import * as combosExport from "@/app/api/admin/combos/export/route";
import * as adminReviews from "@/app/api/admin/reviews/route";
import * as leads from "@/app/api/admin/whatsapp-clicks/[id]/route";
import * as reviews from "@/app/api/reviews/route";
import { recalculateProductReviewStats } from "@/lib/reviews/stats";
import { createStdWorld, type StdWorld } from "../fixtures/world";
import { createCategory, createCombo, createCoupon, createOrder, createProduct, createUser } from "../fixtures/factory";
import { RUN_ID, testCouponCode } from "../fixtures/run";
import { call } from "../helpers/http";
import { actAs } from "../helpers/session";

let w: StdWorld;
beforeAll(async () => {
  w = await createStdWorld();
});

const slugOf = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const day = 24 * 60 * 60 * 1000;
const randomId = "00000000-0000-4000-8000-000000000000";

function productBody(name: string, categoryId: string, extra: Record<string, unknown> = {}) {
  return {
    name,
    description: "<p>Cold pressed <b>groundnut</b> oil</p>",
    images: ["https://example.test/g.jpg"],
    categoryId,
    variants: [
      { label: "500ml", sku: `${RUN_ID}-g500`, originalPrice: 220, price: 200, stock: 5 },
      { label: "1L", sku: `${RUN_ID}-g1`, originalPrice: 420, price: 380, stock: 5 },
    ],
    ...extra,
  };
}

function slideBody(extra: Record<string, unknown> = {}) {
  return {
    imageUrl: "/banner.png",
    navigationLink: "/shop",
    headline: `Slide ${RUN_ID}`,
    altText: RUN_ID,
    sortOrder: 950,
    isActive: true,
    ...extra,
  };
}

describe("AUTH-036 admin API sweep: non-admins always get 401 and change nothing", () => {
  type Case = [string, (r: Request, c: { params: Promise<Record<string, string>> }) => Promise<Response>, string?, unknown?];
  const id = () => w.pSesame.id;
  const cases = (): Case[] => [
    ["POST /api/products", products.POST, undefined, productBody(`Sweep ${RUN_ID}`, w.catOils.id)],
    ["PUT /api/products/[id]", productById.PUT, id(), { name: "Hacked" }],
    ["DELETE /api/products/[id]", productById.DELETE, id()],
    ["POST /api/categories", categories.POST, undefined, { name: `Sweep ${RUN_ID}` }],
    ["PUT /api/categories/[id]", categoryById.PUT, w.catOils.id, { name: "Hacked" }],
    ["DELETE /api/categories/[id]", categoryById.DELETE, w.catHidden.id],
    ["POST /api/combos", combos.POST, undefined, { name: "x" }],
    ["PUT /api/combos/[id]", comboById.PUT, w.comboLive.id, { price: 1 }],
    ["DELETE /api/combos/[id]", comboById.DELETE, w.comboLive.id],
    ["GET /api/carousels", carousels.GET],
    ["POST /api/carousels", carousels.POST, undefined, slideBody()],
    ["GET /api/carousels/[id]", carouselById.GET, randomId],
    ["PUT /api/carousels/[id]", carouselById.PUT, randomId, slideBody()],
    ["DELETE /api/carousels/[id]", carouselById.DELETE, randomId],
    ["PATCH /api/carousels/[id]/status", carouselStatus.PATCH, randomId, { isActive: false }],
    ["GET /api/admin/coupons", coupons.GET],
    ["POST /api/admin/coupons", coupons.POST, undefined, { code: testCouponCode(), name: "x", discountValue: 10 }],
    ["PUT /api/admin/coupons/[id]", couponById.PUT, w.pct10.id, { status: "INACTIVE" }],
    ["DELETE /api/admin/coupons/[id]", couponById.DELETE, w.pct10.id],
    ["POST /api/admin/orders", adminOrders.POST, undefined, {}],
    ["PATCH /api/admin/orders", adminOrders.PATCH, undefined, { id: randomId, status: "CANCELLED" }],
    ["DELETE /api/admin/orders/[id]", adminOrderById.DELETE, randomId],
    ["POST /api/admin/orders/[id]/refund", refund.POST, randomId],
    ["GET /api/admin/orders/[id]/tracking", tracking.GET, randomId],
    ["PUT /api/admin/orders/[id]/tracking", tracking.PUT, randomId, { trackingNumber: "12345678901" }],
    ["DELETE /api/admin/orders/[id]/tracking", tracking.DELETE, randomId],
    ["POST /api/admin/orders/[id]/tracking/sync", trackingSync.POST, randomId],
    ["GET /api/admin/tracking", adminTracking.GET],
    ["GET /api/admin/users", users.GET],
    ["POST /api/admin/users", users.POST, undefined, { name: "x", email: "x@y.z", password: "secret1" }],
    ["PATCH /api/admin/users", users.PATCH, undefined, { id: w.customerA.id, role: "admin" }],
    ["PUT /api/admin/users/[id]", userById.PUT, w.customerA.id, { role: "admin" }],
    ["DELETE /api/admin/users/[id]", userById.DELETE, w.customerB.id],
    ["POST /api/admin/users/export", usersExport.POST, undefined, {}],
    ["POST /api/admin/orders/export", ordersExport.POST, undefined, {}],
    ["POST /api/admin/products/export", productsExport.POST, undefined, {}],
    ["POST /api/admin/combos/export", combosExport.POST, undefined, {}],
    ["PATCH /api/admin/reviews", adminReviews.PATCH, undefined, { id: randomId, isApproved: true }],
    ["DELETE /api/admin/reviews", adminReviews.DELETE, undefined, { id: randomId }],
    ["PATCH /api/admin/whatsapp-clicks/[id]", leads.PATCH, randomId, { status: "CONTACTED" }],
  ];

  async function snapshot() {
    const [p, c, cb, cp, u] = await Promise.all([
      prisma.product.findUniqueOrThrow({ where: { id: w.pSesame.id } }),
      prisma.category.findMany({ where: { id: { in: [w.catOils.id, w.catHidden.id] } }, orderBy: { id: "asc" } }),
      prisma.combo.findUniqueOrThrow({ where: { id: w.comboLive.id } }),
      prisma.coupon.findUniqueOrThrow({ where: { id: w.pct10.id } }),
      prisma.user.findMany({ where: { id: { in: [w.customerA.id, w.customerB.id] } }, orderBy: { id: "asc" } }),
    ]);
    const marked = await Promise.all([
      prisma.product.count({ where: { slug: { contains: RUN_ID } } }),
      prisma.category.count({ where: { slug: { contains: RUN_ID } } }),
      prisma.coupon.count({ where: { code: { startsWith: RUN_ID.toUpperCase() } } }),
      prisma.carousel.count({ where: { headline: { contains: RUN_ID } } }),
      prisma.user.count({ where: { email: { contains: RUN_ID } } }),
    ]);
    return JSON.stringify({ p, c, cb, cp, u, marked });
  }

  for (const who of ["anonymous", "customer", "demoted admin (AUTH-037)"] as const) {
    it(`${who}`, async () => {
      if (who === "anonymous") actAs(null);
      else if (who === "customer") actAs(w.customerA);
      else {
        const demoted = await createUser({ role: "user" });
        actAs(demoted, { role: "admin" }); // JWT still says admin, DB says user
      }
      const before = await snapshot();
      for (const [name, handler, paramId, body] of cases()) {
        const res = await call(handler, {
          method: name.split(" ")[0],
          params: paramId ? { id: paramId } : {},
          body,
        });
        expect(res.status, name).toBe(401);
      }
      expect(await snapshot()).toBe(before);
    });
  }
});

describe("public catalog API", () => {
  it("CAT-001 GET /api/products lists only active products", async () => {
    actAs(null);
    const res = await call(products.GET, { path: "/api/products" });
    expect(res.status).toBe(200);
    const ids = res.json.data.map((p: { _id: string }) => p._id);
    expect(ids).toContain(w.pSesame.id);
    expect(ids).not.toContain(w.pInactive.id);
    const sesame = res.json.data.find((p: { _id: string }) => p._id === w.pSesame.id);
    expect(sesame.categoryId).toMatchObject({ _id: w.catOils.id });
    expect(sesame.variants.every((v: { _id?: string }) => v._id)).toBe(true);
  });

  it("CAT-002 bestSeller filter", async () => {
    const res = await call(products.GET, { path: "/api/products?bestSeller=true" });
    expect(res.json.data.every((p: { isBestSeller: boolean }) => p.isBestSeller)).toBe(true);
    expect(res.json.data.map((p: { _id: string }) => p._id)).toContain(w.pSesame.id);
  });

  it("CAT-003 ?active=false shows inactive products to admins only", async () => {
    actAs(null);
    const anon = await call(products.GET, { path: "/api/products?active=false" });
    expect(anon.json.data.map((p: { _id: string }) => p._id)).not.toContain(w.pInactive.id);
    actAs(w.admin);
    const admin = await call(products.GET, { path: "/api/products?active=false" });
    expect(admin.json.data.map((p: { _id: string }) => p._id)).toContain(w.pInactive.id);
  });

  it("CAT-004 product by id: found, unknown, inactive", async () => {
    actAs(null);
    expect((await call(productById.GET, { params: { id: w.pSesame.id } })).status).toBe(200);
    expect((await call(productById.GET, { params: { id: randomId } })).status).toBe(404);
    expect((await call(productById.GET, { params: { id: w.pInactive.id } })).status).toBe(404);
    actAs(w.admin);
    expect((await call(productById.GET, { params: { id: w.pInactive.id } })).status).toBe(200);
  });

  it("CAT-005 categories: sorted, inactive hidden from the public", async () => {
    actAs(null);
    const res = await call(categories.GET);
    const ids = res.json.data.map((c: { _id: string }) => c._id);
    expect(ids).toContain(w.catOils.id);
    expect(ids).not.toContain(w.catHidden.id);
    const orders = res.json.data.map((c: { sortOrder: number }) => c.sortOrder);
    expect([...orders].sort((a, b) => a - b)).toEqual(orders);
    actAs(w.admin);
    expect((await call(categories.GET)).json.data.map((c: { _id: string }) => c._id)).toContain(w.catHidden.id);
  });

  it("CMB-001 inactive combos are hidden from the public", async () => {
    actAs(null);
    const ids = (await call(combos.GET)).json.data.map((c: { _id: string }) => c._id);
    expect(ids).toContain(w.comboLive.id);
    expect(ids).not.toContain(w.comboInactive.id);
  });
});

describe("admin products", () => {
  it("ADM-PRD-001 create assigns slug and variant ids and revalidates", async () => {
    actAs(w.admin);
    const name = `Groundnut Oil ${RUN_ID}`;
    const res = await call(products.POST, { body: productBody(name, w.catOils.id) });
    expect(res.status).toBe(200);
    expect(res.json.data.slug).toBe(slugOf(name));
    for (const v of res.json.data.variants) expect(v._id).toMatch(/^[0-9a-f-]{36}$/);
    const paths = vi.mocked(revalidatePath).mock.calls.map((c) => c[0]);
    expect(paths).toEqual(expect.arrayContaining(["/", "/shop", "/bestsellers"]));
  });

  it.each([
    ["short name", { name: "G" }],
    ["empty description", { description: "<p> </p>" }],
    ["no variants", { variants: [] }],
    ["variant without sku", { variants: [{ label: "1L", originalPrice: 1, price: 1, stock: 1 }] }],
    ["no category", { categoryId: undefined }],
    ["negative price (ADM-PRD-004)", { variants: [{ label: "1L", sku: "x", originalPrice: 1, price: -10, stock: 1 }] }],
    ["negative stock (ADM-PRD-004)", { variants: [{ label: "1L", sku: "x", originalPrice: 1, price: 10, stock: -5 }] }],
    ["unknown category", { categoryId: randomId }],
  ])("ADM-PRD-002 rejects %s", async (_l, patch) => {
    actAs(w.admin);
    const before = await prisma.product.count({ where: { slug: { contains: RUN_ID } } });
    const res = await call(products.POST, { body: { ...productBody(`Bad ${RUN_ID}`, w.catOils.id), ...patch } });
    expect(res.status).toBe(400);
    expect(typeof res.json.error).toBe("string");
    expect(await prisma.product.count({ where: { slug: { contains: RUN_ID } } })).toBe(before);
  });

  it("ADM-PRD-003 duplicate name gets a unique slug instead of a 500", async () => {
    actAs(w.admin);
    const name = `Dup Oil ${RUN_ID}`;
    const a = await call(products.POST, { body: productBody(name, w.catOils.id) });
    const b = await call(products.POST, { body: productBody(name, w.catOils.id) });
    expect(b.status).toBe(200);
    expect(b.json.data.slug).toBe(`${a.json.data.slug}-2`);
  });

  it("ADM-PRD-005 rename keeps the slug unless a slug is sent", async () => {
    actAs(w.admin);
    const p = await createProduct({ categoryId: w.catOils.id });
    const res = await call(productById.PUT, { method: "PUT", params: { id: p.id }, body: { name: "Sesame Oil Premium" } });
    expect(res.status).toBe(200);
    expect(res.json.data.slug).toBe(p.slug);
    const res2 = await call(productById.PUT, { method: "PUT", params: { id: p.id }, body: { slug: `${p.slug}-new` } });
    expect(res2.json.data.slug).toBe(`${p.slug}-new`);
  });

  it("ADM-PRD-006 PUT strips unknown and protected fields", async () => {
    actAs(w.admin);
    const p = await createProduct({ categoryId: w.catOils.id });
    const res = await call(productById.PUT, { method: "PUT", params: { id: p.id }, body: { averageRating: 5, reviewCount: 999 } });
    expect(res.status).toBe(200);
    const saved = await prisma.product.findUniqueOrThrow({ where: { id: p.id } });
    expect(saved.reviewCount).toBe(0);
    expect((await call(productById.PUT, { method: "PUT", params: { id: p.id }, body: { foo: 1 } })).status).toBe(200);
    expect((await call(productById.PUT, { method: "PUT", params: { id: p.id }, body: { variants: [{ label: "x", sku: "x", originalPrice: 1, price: -1, stock: 1 }] } })).status).toBe(400);
  });

  it("ADM-PRD-007 variant ids are kept on edit; new variants get one", async () => {
    actAs(w.admin);
    const p = await createProduct({ categoryId: w.catOils.id, variants: [{ label: "1L" }, { label: "2L" }] });
    const current = (await prisma.product.findUniqueOrThrow({ where: { id: p.id } })).variants as Array<Record<string, unknown>>;
    const res = await call(productById.PUT, {
      method: "PUT",
      params: { id: p.id },
      body: { variants: [...current, { label: "5L", sku: `${RUN_ID}-5l`, originalPrice: 2000, price: 1800, stock: 3 }] },
    });
    expect(res.status).toBe(200);
    const ids = res.json.data.variants.map((v: { _id: string }) => v._id);
    expect(ids.slice(0, 2)).toEqual(p.variantIds);
    expect(ids[2]).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("ADM-PRD-008 edit unknown id is 404", async () => {
    actAs(w.admin);
    expect((await call(productById.PUT, { method: "PUT", params: { id: randomId }, body: { name: "Nope" } })).status).toBe(404);
  });

  it("ADM-PRD-009 delete: unused product is removed, ordered product is archived", async () => {
    actAs(w.admin);
    const unused = await createProduct({ categoryId: w.catOils.id });
    const res = await call(productById.DELETE, { method: "DELETE", params: { id: unused.id } });
    expect(res.status).toBe(200);
    expect(await prisma.product.findUnique({ where: { id: unused.id } })).toBeNull();

    const ordered = await createProduct({ categoryId: w.catOils.id });
    await createOrder({ items: [{ productId: ordered.id, variantId: ordered.variantIds[0], quantity: 1 }] });
    const res2 = await call(productById.DELETE, { method: "DELETE", params: { id: ordered.id } });
    expect(res2.status).toBe(200);
    expect(res2.json.data.archived).toBe(true);
    expect((await prisma.product.findUniqueOrThrow({ where: { id: ordered.id } })).isActive).toBe(false);
  });

  it("ADM-PRD-010 clearing the offer window turns the offer off", async () => {
    actAs(w.admin);
    const p = await createProduct({
      categoryId: w.catOils.id,
      variants: [{ price: 500, offerPrice: 420 }],
      offer: { startsAt: new Date(Date.now() - day), endsAt: new Date(Date.now() + day) },
    });
    const res = await call(productById.PUT, { method: "PUT", params: { id: p.id }, body: { offerStartsAt: null, offerEndsAt: null } });
    expect(res.status).toBe(200);
    const saved = await prisma.product.findUniqueOrThrow({ where: { id: p.id } });
    expect(saved.offerStartsAt).toBeNull();
    expect(saved.offerEndsAt).toBeNull();
    const { offerIsLive } = await import("@/lib/products/commerce");
    expect(offerIsLive(saved as never)).toBe(false);
  });
});

describe("admin categories", () => {
  it("ADM-CAT-001 create and validation", async () => {
    actAs(w.admin);
    const name = `Oil Cakes ${RUN_ID}`;
    const res = await call(categories.POST, { body: { name } });
    expect(res.status).toBe(200);
    expect(res.json.data).toMatchObject({ slug: slugOf(name), sortOrder: 0 });
    expect((await call(categories.POST, { body: { name: "O" } })).status).toBe(400);
    const dup = await call(categories.POST, { body: { name } });
    expect(dup.json.data.slug).toBe(`${slugOf(name)}-2`);
  });

  it("ADM-CAT-002 rename keeps the slug; unknown id 404", async () => {
    actAs(w.admin);
    const c = await createCategory();
    const res = await call(categoryById.PUT, { method: "PUT", params: { id: c.id }, body: { name: "Renamed" } });
    expect(res.status).toBe(200);
    expect(res.json.data.slug).toBe(c.slug);
    expect((await call(categoryById.PUT, { method: "PUT", params: { id: randomId }, body: { name: "Renamed" } })).status).toBe(404);
  });

  it("ADM-CAT-003 delete: empty ok, in-use 409", async () => {
    actAs(w.admin);
    const empty = await createCategory();
    expect((await call(categoryById.DELETE, { method: "DELETE", params: { id: empty.id } })).status).toBe(200);
    const res = await call(categoryById.DELETE, { method: "DELETE", params: { id: w.catOils.id } });
    expect(res.status).toBe(409);
    expect(res.json.error).toMatch(/product\(s\)/);
    expect(await prisma.category.findUnique({ where: { id: w.catOils.id } })).not.toBeNull();
  });
});

describe("admin combos", () => {
  const comboBody = (extra: Record<string, unknown> = {}) => ({
    name: `<b>Family Pack ${RUN_ID}</b>`,
    price: 999,
    originalPrice: 1200,
    items: [
      { productId: w.pSesame.id, variantId: w.v1L, quantity: 1, productName: "Sesame", variantLabel: "1L" },
      { isCustom: true, productName: "Wooden Spoon", customPrice: 0 },
    ],
    ...extra,
  });

  it("ADM-CMB-001 create", async () => {
    actAs(w.admin);
    const res = await call(combos.POST, { body: comboBody() });
    expect(res.status).toBe(200);
    expect(res.json.data.slug).toBe(slugOf(`Family Pack ${RUN_ID}`));
    expect(res.json.data.items).toHaveLength(2);
    expect(res.json.data.startsAt ?? null).toBeNull();
  });

  it.each([
    ["short name", { name: "<p>A</p>" }, /name/i],
    ["price 0", { price: 0 }, /price: Combo price must be greater than 0/],
    ["negative original price", { originalPrice: -1 }, /originalPrice/],
    ["no items", { items: [] }, /At least one item/],
    ["item without variant or name", { items: [{ quantity: 1 }] }, /selected variant or a custom product name/],
  ])("ADM-CMB-002 rejects %s", async (_l, patch, message) => {
    actAs(w.admin);
    const res = await call(combos.POST, { body: comboBody(patch) });
    expect(res.status).toBe(400);
    expect(String(res.json.error)).toMatch(message);
  });

  it("ADM-CMB-003 duplicate name gets a suffix", async () => {
    actAs(w.admin);
    const name = `Twin ${RUN_ID}`;
    await call(combos.POST, { body: comboBody({ name }) });
    const res = await call(combos.POST, { body: comboBody({ name }) });
    expect(res.status).toBe(200);
    expect(res.json.data.slug).toBe(`${slugOf(name)}-2`);
  });

  it("ADM-CMB-004 update: bad dates clear, negative price rejected", async () => {
    actAs(w.admin);
    const c = await createCombo({ items: [{ productId: w.pSesame.id, variantId: w.v1L }], startsAt: new Date(), endsAt: new Date(Date.now() + day) });
    const res = await call(comboById.PUT, { method: "PUT", params: { id: c.id }, body: { startsAt: "garbage", endsAt: "" } });
    expect(res.status).toBe(200);
    const saved = await prisma.combo.findUniqueOrThrow({ where: { id: c.id } });
    expect(saved.startsAt).toBeNull();
    expect(saved.endsAt).toBeNull();
    expect(saved.slug).toBe(c.slug);
    expect((await call(comboById.PUT, { method: "PUT", params: { id: c.id }, body: { price: -5 } })).status).toBe(400);
  });
});

describe("admin coupons", () => {
  const valid = () => ({
    validFrom: new Date(Date.now() - day).toISOString(),
    validTo: new Date(Date.now() + 10 * day).toISOString(),
  });

  it("ADM-CPN-001 list and stats", async () => {
    actAs(w.admin);
    await createCoupon({ timesUsed: 3 });
    const res = await call(coupons.GET);
    expect(res.status).toBe(200);
    const codes = res.json.data.map((c: { code: string }) => c.code);
    expect(codes).toContain(w.pct10.code);
    // Stats describe the same list (the shared DB may hold other coupons).
    const data = res.json.data as Array<{ timesUsed: number; createdAt: string }>;
    expect(res.json.stats.total).toBe(data.length);
    expect(res.json.stats.totalRedemptions).toBe(data.reduce((s, c) => s + c.timesUsed, 0));
    const times = data.map((c) => new Date(c.createdAt).getTime());
    expect([...times].sort((a, b) => b - a)).toEqual(times);
  });

  it("ADM-CPN-002 create normalizes the code and applies defaults", async () => {
    actAs(w.admin);
    const code = testCouponCode("diwali");
    const res = await call(coupons.POST, { body: { code: ` ${code.toLowerCase()} `, name: `Diwali ${RUN_ID}`, discountValue: 25, ...valid() } });
    expect(res.status).toBe(201);
    expect(res.json.data).toMatchObject({ code, discountType: "PERCENTAGE", status: "ACTIVE", usageLimit: 0, timesUsed: 0 });
  });

  it("ADM-CPN-003 duplicate code", async () => {
    actAs(w.admin);
    const res = await call(coupons.POST, { body: { code: w.pct10.code.toLowerCase(), name: `Dup ${RUN_ID}`, discountValue: 5, ...valid() } });
    expect(res.status).toBe(400);
    expect(res.json.error).toBe("A coupon with this code already exists");
  });

  it.each([
    ["short code", { code: "A" }],
    ["negative value", { discountValue: -1 }],
    ["fractional limit", { usageLimit: 1.5 }],
    ["missing validFrom", { validFrom: undefined }],
    ["percentage over 100 (ADM-CPN-005)", { discountValue: 150 }],
    ["validTo before validFrom (ADM-CPN-005)", { validTo: new Date(Date.now() - 2 * day).toISOString() }],
    ["invalid date (ADM-CPN-005)", { validFrom: "not-a-date" }],
  ])("ADM-CPN-004 rejects %s", async (_l, patch) => {
    actAs(w.admin);
    const res = await call(coupons.POST, { body: { code: testCouponCode(), name: `Bad ${RUN_ID}`, discountValue: 10, ...valid(), ...patch } });
    expect(res.status).toBe(400);
    expect(typeof res.json.error).toBe("string");
  });

  it("ADM-CPN-006 update", async () => {
    actAs(w.admin);
    const flat = await createCoupon({ discountType: "FIXED", discountValue: 50 });
    const taken = await call(couponById.PUT, { method: "PUT", params: { id: flat.id }, body: { code: w.pct10.code } });
    expect(taken.json.error).toBe("Another coupon with this code already exists");
    const ok = await call(couponById.PUT, { method: "PUT", params: { id: flat.id }, body: { status: "INACTIVE" } });
    expect(ok.status).toBe(200);
    const notFound = await call(couponById.PUT, { method: "PUT", params: { id: randomId }, body: { status: "INACTIVE" } });
    expect(notFound.status).toBe(404);
    expect(notFound.json.error).toBe("Coupon not found");
    const pct = await createCoupon({ discountType: "PERCENTAGE", discountValue: 10 });
    expect((await call(couponById.PUT, { method: "PUT", params: { id: pct.id }, body: { discountValue: 150 } })).status).toBe(400);
  });

  it("ADM-CPN-007 delete twice", async () => {
    actAs(w.admin);
    const c = await createCoupon();
    const res = await call(couponById.DELETE, { method: "DELETE", params: { id: c.id } });
    expect(res.status).toBe(200);
    expect(res.json.success).toBe(true);
    expect((await call(couponById.DELETE, { method: "DELETE", params: { id: c.id } })).status).toBe(404);
  });
});

describe("carousels", () => {
  it("ADM-CAR-002 list and create", async () => {
    actAs(w.admin);
    const created = await call(carousels.POST, { body: slideBody() });
    expect(created.status).toBe(201);
    expect((await call(carousels.POST, { body: slideBody({ navigationLink: "javascript:alert(1)" }) })).status).toBe(400);
    const list = await call(carousels.GET);
    const orders = list.json.data.map((s: { sortOrder: number }) => s.sortOrder);
    expect([...orders].sort((a, b) => a - b)).toEqual(orders);
  });

  it("ADM-CAR-003 update needs the full body; unknown id 404", async () => {
    actAs(w.admin);
    const id = (await call(carousels.POST, { body: slideBody() })).json.data._id;
    expect((await call(carouselById.PUT, { method: "PUT", params: { id }, body: slideBody({ headline: `Edited ${RUN_ID}` }) })).status).toBe(200);
    expect((await call(carouselById.PUT, { method: "PUT", params: { id }, body: { headline: "x" } })).status).toBe(400);
    expect((await call(carouselById.PUT, { method: "PUT", params: { id: randomId }, body: slideBody() })).status).toBe(404);
  });

  it("ADM-CAR-004 status toggle validation and unknown id", async () => {
    actAs(w.admin);
    const id = (await call(carousels.POST, { body: slideBody() })).json.data._id;
    const bad = await call(carouselStatus.PATCH, { method: "PATCH", params: { id }, body: { isActive: "yes" } });
    expect(bad.json.error).toBe("isActive must be a boolean");
    expect((await call(carouselStatus.PATCH, { method: "PATCH", params: { id: randomId }, body: { isActive: false } })).status).toBe(404);
    expect((await call(carouselStatus.PATCH, { method: "PATCH", params: { id }, body: { isActive: false } })).json.data.isActive).toBe(false);
  });

  it("ADM-CAR-005 + ADM-CAR-006 public list shows active slides only, cached; deleted slides vanish", async () => {
    actAs(w.admin);
    const a = (await call(carousels.POST, { body: slideBody({ sortOrder: 960 }) })).json.data._id;
    const b = (await call(carousels.POST, { body: slideBody({ sortOrder: 961, isActive: false }) })).json.data._id;
    actAs(null);
    const res = await call(carouselPublic.GET);
    expect(res.response.headers.get("cache-control")).toBe("public, s-maxage=60, stale-while-revalidate=120");
    const ids = res.json.data.map((s: { _id: string }) => s._id);
    expect(ids).toContain(a);
    expect(ids).not.toContain(b);
    actAs(w.admin);
    expect((await call(carouselById.DELETE, { method: "DELETE", params: { id: a } })).status).toBe(200);
    actAs(null);
    expect((await call(carouselPublic.GET)).json.data.map((s: { _id: string }) => s._id)).not.toContain(a);
  });
});

describe("reviews", () => {
  async function review(productId: string, rating: number, isApproved: boolean) {
    return prisma.review.create({ data: { productId, authorName: `Reviewer ${RUN_ID}`, rating, body: "Nice oil", isApproved } });
  }

  it("REV-001 public list needs productId and shows approved only", async () => {
    const p = await createProduct({ categoryId: w.catOils.id });
    await review(p.id, 5, true);
    await review(p.id, 1, false);
    expect((await call(reviews.GET, { path: "/api/reviews" })).json.error).toBe("productId required");
    const res = await call(reviews.GET, { path: `/api/reviews?productId=${p.id}` });
    expect(res.json.data).toHaveLength(1);
  });

  it("REV-002 submit is moderated and does not change stats", async () => {
    actAs(null);
    const p = await createProduct({ categoryId: w.catOils.id });
    const res = await call(reviews.POST, { body: { productId: p.id, authorName: `Anu ${RUN_ID}`, rating: 5, body: "Great oil" } });
    expect(res.status).toBe(200);
    expect(res.json.data.isApproved).toBe(false);
    expect((await prisma.product.findUniqueOrThrow({ where: { id: p.id } })).reviewCount).toBe(0);
  });

  it("REV-003 verified purchase flag", async () => {
    const p = await createProduct({ categoryId: w.catOils.id });
    const buyer = await createUser();
    const other = await createUser();
    await createOrder({ userId: buyer.id, paymentStatus: "PAID", status: "CONFIRMED", items: [{ productId: p.id, variantId: p.variantIds[0], quantity: 1 }] });
    const body = { productId: p.id, authorName: `Anu ${RUN_ID}`, rating: 5, body: "Great oil" };
    actAs(buyer);
    const a = await call(reviews.POST, { body });
    actAs(other);
    const b = await call(reviews.POST, { body });
    actAs(null);
    const c = await call(reviews.POST, { body });
    expect([a.json.data.isVerified, b.json.data.isVerified, c.json.data.isVerified]).toEqual([true, false, false]);
    expect(a.json.data.userId).toBe(buyer.id);
  });

  it.each([
    ["rating 0", { rating: 0 }],
    ["rating 6", { rating: 6 }],
    ["short author", { authorName: "A" }],
    ["short body", { body: " a " }],
    ["fractional rating (REV-005)", { rating: 4.5 }],
  ])("REV-004 rejects %s", async (_l, patch) => {
    actAs(null);
    const res = await call(reviews.POST, { body: { productId: w.pSesame.id, authorName: `Anu ${RUN_ID}`, rating: 5, body: "Great oil", ...patch } });
    expect(res.status).toBe(400);
  });

  it("REV-006 unknown product is 404", async () => {
    actAs(null);
    const res = await call(reviews.POST, { body: { productId: randomId, authorName: `Anu ${RUN_ID}`, rating: 5, body: "Great oil" } });
    expect(res.status).toBe(404);
  });

  it("REV-007 a signed-in user can review a product once (guests stay moderated)", async () => {
    const p = await createProduct({ categoryId: w.catOils.id });
    const user = await createUser();
    actAs(user);
    const body = { productId: p.id, authorName: `Anu ${RUN_ID}`, rating: 5, body: "Great oil" };
    expect((await call(reviews.POST, { body })).status).toBe(200);
    expect((await call(reviews.POST, { body })).status).toBe(409);
  });

  it("REV-008 stats recalculation", async () => {
    const p = await createProduct({ categoryId: w.catOils.id });
    await review(p.id, 5, true);
    await review(p.id, 4, true);
    await review(p.id, 4, true);
    await review(p.id, 1, false);
    await recalculateProductReviewStats(p.id);
    expect(await prisma.product.findUniqueOrThrow({ where: { id: p.id } })).toMatchObject({ averageRating: 4.3, reviewCount: 3 });
    await prisma.review.updateMany({ where: { productId: p.id }, data: { isApproved: false } });
    await recalculateProductReviewStats(p.id);
    expect(await prisma.product.findUniqueOrThrow({ where: { id: p.id } })).toMatchObject({ averageRating: 0, reviewCount: 0 });
  });

  it("ADM-REV-001 approve and unapprove recalculate stats", async () => {
    actAs(w.admin);
    const p = await createProduct({ categoryId: w.catOils.id });
    await review(p.id, 4, true);
    await review(p.id, 4, true);
    const pending = await review(p.id, 5, false);
    await call(adminReviews.PATCH, { method: "PATCH", body: { id: pending.id, isApproved: true } });
    expect(await prisma.product.findUniqueOrThrow({ where: { id: p.id } })).toMatchObject({ averageRating: 4.3, reviewCount: 3 });
    await call(adminReviews.PATCH, { method: "PATCH", body: { id: pending.id, isApproved: false } });
    expect(await prisma.product.findUniqueOrThrow({ where: { id: p.id } })).toMatchObject({ averageRating: 4, reviewCount: 2 });
    expect((await call(adminReviews.PATCH, { method: "PATCH", body: { id: randomId, isApproved: true } })).status).toBe(404);
    expect((await call(adminReviews.PATCH, { method: "PATCH", body: { id: pending.id } })).status).toBe(400);
  });

  it("ADM-REV-002 delete recalculates; unknown is silent; missing id 400", async () => {
    actAs(w.admin);
    const p = await createProduct({ categoryId: w.catOils.id });
    const r = await review(p.id, 5, true);
    await recalculateProductReviewStats(p.id);
    expect((await call(adminReviews.DELETE, { method: "DELETE", body: { id: r.id } })).status).toBe(200);
    expect((await prisma.product.findUniqueOrThrow({ where: { id: p.id } })).reviewCount).toBe(0);
    expect((await call(adminReviews.DELETE, { method: "DELETE", body: { id: randomId } })).status).toBe(200);
    expect((await call(adminReviews.DELETE, { method: "DELETE", body: {} })).status).toBe(400);
  });
});
