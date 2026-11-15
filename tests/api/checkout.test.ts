/* eslint-disable @typescript-eslint/no-explicit-any -- loose JSON in test helpers */
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { POST as createOrderRoute, GET as listOrders } from "@/app/api/orders/route";
import { POST as validateCoupon } from "@/app/api/coupons/validate/route";
import { POST as refund } from "@/app/api/admin/orders/[id]/refund/route";
import { markOrderPaid } from "@/lib/orders/mark-paid";
import { validateAndCalculateCouponDiscount } from "@/lib/orders/coupons";
import { getComboBySlug } from "@/lib/catalog/get-combo";
import { createCoupon, createOrder, createUser, setVariantStock, shippingAddress, variantStock } from "../fixtures/factory";
import { createStdWorld, type StdWorld } from "../fixtures/world";
import { call } from "../helpers/http";
import { actAs } from "../helpers/session";

let w: StdWorld;
beforeAll(async () => {
  w = await createStdWorld();
});
beforeEach(async () => {
  await setVariantStock(w.pSesame.id, w.v1L, 10);
  actAs(w.customerA);
});

const day = 86_400_000;

function orderBody(items: Array<{ productId: string; variantId: string; quantity: number }>, extra: Record<string, unknown> = {}) {
  return { items, shippingAddress: shippingAddress(), ...extra };
}

async function placeOrder(items: Array<{ productId: string; variantId: string; quantity: number }>, extra: Record<string, unknown> = {}) {
  return call(createOrderRoute, { body: orderBody(items, extra) });
}

describe("order creation (POST /api/orders)", () => {
  it("CHK-004 requires login", async () => {
    actAs(null);
    const before = await prisma.order.count({ where: { userId: w.customerA.id } });
    const res = await placeOrder([{ productId: w.pSesame.id, variantId: w.v1L, quantity: 1 }]);
    expect(res.status).toBe(401);
    expect(await prisma.order.count({ where: { userId: w.customerA.id } })).toBe(before);
  });

  it.each([
    ["no items", { items: [] }],
    ["quantity 0", { qty: 0 }],
    ["quantity -1", { qty: -1 }],
    ["quantity 1.5", { qty: 1.5 }],
    ["missing line1", { address: { line1: undefined } }],
    ["5-digit pincode", { address: { pincode: "12345" } }],
    ["letters as pincode", { address: { pincode: "ABCDEF" } }],
    ["short phone", { address: { phone: "123" } }],
    ["letters as phone", { address: { phone: "abcdefghij" } }],
    ["bad email", { address: { email: "bad" } }],
  ])("CHK-005 rejects %s", async (_label, variant: any) => {
    const items = variant.items ?? [{ productId: w.pSesame.id, variantId: w.v1L, quantity: variant.qty ?? 1 }];
    const res = await call(createOrderRoute, {
      body: { items, shippingAddress: shippingAddress(variant.address ?? {}) },
    });
    expect(res.status).toBe(400);
    expect(res.json.error).toBeTruthy();
  });

  it("CHK-005 accepts +91 / spaced phone formats", async () => {
    const res = await call(createOrderRoute, {
      body: orderBody([{ productId: w.pSesame.id, variantId: w.v1L, quantity: 1 }], {
        shippingAddress: shippingAddress({ phone: "+91 98765 43210" }),
      }),
    });
    expect(res.status).toBe(200);
  });

  it("CHK-006 ignores client prices, names, totals and statuses", async () => {
    const res = await call(createOrderRoute, {
      body: {
        items: [{ productId: w.pSesame.id, variantId: w.v1L, quantity: 2, price: 1, name: "x" }],
        shippingAddress: shippingAddress(),
        pricing: { total: 1 },
        status: "DELIVERED",
        paymentStatus: "PAID",
      },
    });
    expect(res.status).toBe(200);
    const order = res.json.data;
    expect(order.items[0].price).toBe(350);
    expect(order.items[0].name).toBe(w.pSesame.name);
    expect(order.pricing.total).toBe(700);
    expect(order.status).toBe("PENDING");
    expect(order.paymentStatus).toBe("PENDING");
  });

  it("CHK-007 uses the live offer price", async () => {
    const res = await placeOrder([{ productId: w.pOffer.id, variantId: w.pOffer.variantIds[0], quantity: 2 }]);
    expect(res.json.data.items[0].price).toBe(420);
    expect(res.json.data.pricing.total).toBe(840);
    const expired = await placeOrder([{ productId: w.pOfferExpired.id, variantId: w.pOfferExpired.variantIds[0], quantity: 1 }]);
    expect(expired.json.data.items[0].price).toBe(500);
  });

  it("CHK-008 inactive or unknown product is unavailable", async () => {
    for (const productId of [w.pInactive.id, "no-such-product"]) {
      const res = await placeOrder([{ productId, variantId: "v", quantity: 1 }]);
      expect(res.status).toBe(400);
      expect(res.json.error).toBe("One or more products are unavailable");
    }
  });

  it("CHK-009 unknown variant", async () => {
    const res = await placeOrder([{ productId: w.pSesame.id, variantId: "nope", quantity: 1 }]);
    expect(res.status).toBe(400);
    expect(res.json.error).toBe(`Variant not found for ${w.pSesame.name}`);
  });

  it("CHK-010 out of stock and quantity limit", async () => {
    const cases = [
      [w.v1L, 11, "1L"],
      [w.v5L, 1, "5L"],
      [w.vToggleOff, 1, "Toggle off"],
    ] as const;
    for (const [variantId, quantity, label] of cases) {
      const res = await placeOrder([{ productId: w.pSesame.id, variantId, quantity }]);
      expect(res.status).toBe(400);
      expect(res.json.error).toBe(`${w.pSesame.name} (${label}) is out of stock`);
    }
    expect((await placeOrder([{ productId: w.pSesame.id, variantId: w.v1L, quantity: 10 }])).status).toBe(200);
  });

  it("CHK-011 creates the order correctly (stock untouched until paid)", async () => {
    const res = await placeOrder([{ productId: w.pSesame.id, variantId: w.v1L, quantity: 2 }], { couponCode: w.pct10.code });
    expect(res.status).toBe(200);
    const saved = await prisma.order.findUniqueOrThrow({ where: { id: res.json.data._id } });
    expect(saved).toMatchObject({
      userId: w.customerA.id,
      status: "PENDING",
      paymentStatus: "PENDING",
      stockDecremented: false,
      couponCode: w.pct10.code,
    });
    expect(saved.pricing).toEqual({ subtotal: 700, shipping: 0, tax: 0, discount: 70, total: 630 });
    expect(await variantStock(w.pSesame.id, w.v1L)).toBe(10);
  });

  it("CHK-013 attribution is normalised; no UTM means null", async () => {
    const a = await placeOrder([{ productId: w.pSesame.id, variantId: w.v1L, quantity: 1 }], {
      attribution: { source: "Insta Gram!", campaign: "Diwali 2026", landingPath: "/shop?x=1" },
    });
    const savedA = await prisma.order.findUniqueOrThrow({ where: { id: a.json.data._id } });
    expect(savedA.attribution).toMatchObject({ source: "insta-gram", campaign: "diwali-2026", landingPath: "/shop" });
    const b = await placeOrder([{ productId: w.pSesame.id, variantId: w.v1L, quantity: 1 }], { attribution: { landingPath: "/shop" } });
    const savedB = await prisma.order.findUniqueOrThrow({ where: { id: b.json.data._id } });
    expect(savedB.attribution).toBeNull();
  });

  it("CHK-014 checkout address is saved once to the address book", async () => {
    const buyer = await createUser();
    actAs(buyer);
    const address = shippingAddress({ fullName: `Address Owner ${buyer.id}` });
    for (let i = 0; i < 2; i += 1) {
      await call(createOrderRoute, { body: { items: [{ productId: w.pSesame.id, variantId: w.v1L, quantity: 1 }], shippingAddress: address } });
    }
    await call(createOrderRoute, {
      body: { items: [{ productId: w.pSesame.id, variantId: w.v1L, quantity: 1 }], shippingAddress: { ...address, line1: "2 Other Street" } },
    });
    const user = await prisma.user.findUniqueOrThrow({ where: { id: buyer.id } });
    const book = user.addresses as Array<{ isDefault?: boolean }>;
    expect(book).toHaveLength(2);
    expect(book[0].isDefault).toBe(true);
  });

  it("CHK-015 the same variant on two lines is checked as a total", async () => {
    const res = await placeOrder([
      { productId: w.pSesame.id, variantId: w.v1L, quantity: 6 },
      { productId: w.pSesame.id, variantId: w.v1L, quantity: 6 },
    ]);
    expect(res.status).toBe(400);
    expect(res.json.error).toMatch(/out of stock/);
  });

  it("CHK-016 an 'available' toggle variant (stock 999) caps at 999", async () => {
    await setVariantStock(w.pSesame.id, w.v1L, 999);
    expect((await placeOrder([{ productId: w.pSesame.id, variantId: w.v1L, quantity: 1000 }])).status).toBe(400);
    expect((await placeOrder([{ productId: w.pSesame.id, variantId: w.v1L, quantity: 999 }])).status).toBe(200);
  });

  it("CHK-017 lists only my orders, newest first", async () => {
    const buyer = await createUser();
    const first = await createOrder({ userId: buyer.id, items: [{ productId: w.pSesame.id, variantId: w.v1L, quantity: 1 }] });
    await new Promise((r) => setTimeout(r, 10));
    const second = await createOrder({ userId: buyer.id, items: [{ productId: w.pSesame.id, variantId: w.v1L, quantity: 1 }] });
    await createOrder({ userId: w.customerB.id, items: [{ productId: w.pSesame.id, variantId: w.v1L, quantity: 1 }] });
    actAs(buyer);
    const res = await call(listOrders);
    expect(res.json.data.map((o: { _id: string }) => o._id)).toEqual([second.id, first.id]);
    actAs(null);
    expect((await call(listOrders)).status).toBe(401);
  });
});

describe("coupons", () => {
  async function validate(body: Record<string, unknown>) {
    return call(validateCoupon, { body });
  }

  it("CPN-002 no code means no discount and no error", async () => {
    await expect(validateAndCalculateCouponDiscount({ code: undefined, subtotal: 100 })).resolves.toEqual({ discount: 0 });
  });

  it("CPN-003 percentage coupon rounds", async () => {
    const res = await validate({ code: w.pct10.code.toLowerCase(), subtotal: 1005 });
    expect(res.json).toMatchObject({ valid: true, data: { discount: 101, code: w.pct10.code } });
  });

  it("CPN-004 fixed coupon is capped at the subtotal", async () => {
    const flat50 = await createCoupon({ discountType: "FIXED", discountValue: 50 });
    expect((await validate({ code: flat50.code, subtotal: 1000 })).json.data.discount).toBe(50);
    expect((await validate({ code: flat50.code, subtotal: 30 })).json.data.discount).toBe(30);
  });

  it.each([
    ["CPN-005 inactive", { status: "INACTIVE" }, "This coupon is currently inactive"],
    ["CPN-006 not started", { validFrom: new Date(Date.now() + day), validTo: new Date(Date.now() + 2 * day) }, "This coupon is not active yet"],
    ["CPN-007 expired", { validFrom: new Date(Date.now() - 2 * day), validTo: new Date(Date.now() - day) }, "This coupon has expired"],
    ["CPN-008 usage limit reached", { usageLimit: 3, timesUsed: 3 }, "This coupon has reached its maximum usage limit"],
  ] as const)("%s", async (_label, opts, message) => {
    const coupon = await createCoupon(opts as any);
    const res = await validate({ code: coupon.code, subtotal: 500 });
    expect(res.status).toBe(200);
    expect(res.json).toEqual({ valid: false, error: message });
  });

  it("CPN-008 usageLimit 0 means unlimited", async () => {
    const coupon = await createCoupon({ usageLimit: 0, timesUsed: 500 });
    expect((await validate({ code: coupon.code, subtotal: 500 })).json.valid).toBe(true);
  });

  const items = () => [
    { productId: w.pSesame.id, variantId: w.v1L, price: 350, quantity: 2 },
    { productId: w.pOffer.id, variantId: w.pOffer.variantIds[0], price: 420, quantity: 1 },
  ];

  it("CPN-009 product restriction discounts only eligible lines", async () => {
    const onlySesame = await createCoupon({ applicableProducts: [w.pSesame.id] });
    const res = await validate({ code: onlySesame.code, subtotal: 1120, items: items() });
    expect(res.json.data.discount).toBe(70);
  });

  it("CPN-010 variant restrictions take precedence over product restrictions", async () => {
    const coupon = await createCoupon({ applicableProducts: [w.pSesame.id], applicableVariants: [w.v1L] });
    const res = await validate({
      code: coupon.code,
      subtotal: 1350,
      items: [...items(), { productId: w.pSesame.id, variantId: w.vToggleOff, price: 230, quantity: 1 }],
    });
    expect(res.json.data.discount).toBe(70);
  });

  it("CPN-011 restricted with nothing eligible", async () => {
    const onlySesame = await createCoupon({ applicableProducts: [w.pSesame.id] });
    const res = await validate({ code: onlySesame.code, subtotal: 420, items: [items()[1]] });
    expect(res.json.error).toBe("This coupon is not applicable to any products or variants in your cart");
  });

  it("CPN-012 restricted coupon without items", async () => {
    const onlySesame = await createCoupon({ applicableProducts: [w.pSesame.id] });
    const res = await validate({ code: onlySesame.code, subtotal: 420 });
    expect(res.json.error).toBe("Cart items required to validate coupon restrictions");
  });

  it("CPN-013 there is no hard-coded PURE10 (or any static) coupon", async () => {
    const existing = await prisma.coupon.findUnique({ where: { code: "PURE10" } });
    if (existing) return; // a real DB row decides; nothing hard-coded to test
    const res = await validate({ code: "pure10", subtotal: 1000 });
    expect(res.json).toEqual({ valid: false, error: "Invalid or expired coupon code" });
  });

  it("CPN-014 unknown code", async () => {
    const res = await validate({ code: `NOPE${Date.now()}`, subtotal: 100 });
    expect(res.json).toEqual({ valid: false, error: "Invalid or expired coupon code" });
  });

  it.each([
    ["missing code", { subtotal: 1 }],
    ["negative subtotal", { code: "X", subtotal: -1 }],
    ["quantity 0", { code: "X", subtotal: 1, items: [{ productId: "p", price: 1, quantity: 0 }] }],
    ["negative price", { code: "X", subtotal: 1, items: [{ productId: "p", price: -1, quantity: 1 }] }],
  ])("CPN-015 schema: %s", async (_l, body) => {
    const res = await validate(body);
    expect(res.status).toBe(400);
    expect(res.json.valid).toBe(false);
  });

  it("CPN-016 the order discount uses server prices, not the preview subtotal", async () => {
    expect((await validate({ code: w.pct10.code, subtotal: 100000 })).json.data.discount).toBe(10000);
    const res = await placeOrder([{ productId: w.pSesame.id, variantId: w.v1L, quantity: 1 }], { couponCode: w.pct10.code });
    expect(res.json.data.pricing).toMatchObject({ subtotal: 350, discount: 35, total: 315 });
  });

  it("CPN-017 a percentage above 100 is capped (discount never exceeds the subtotal)", async () => {
    const coupon = await createCoupon({ discountValue: 150 });
    const res = await placeOrder([{ productId: w.pSesame.id, variantId: w.v1L, quantity: 1 }], { couponCode: coupon.code });
    expect(res.json.data.pricing).toMatchObject({ subtotal: 350, discount: 350, total: 0 });
  });

  it("CPN-018 usage is counted when the order is PAID, not when it is created", async () => {
    const coupon = await createCoupon({ usageLimit: 10 });
    for (let i = 0; i < 3; i += 1) await validate({ code: coupon.code, subtotal: 100 });
    const res = await placeOrder([{ productId: w.pSesame.id, variantId: w.v1L, quantity: 1 }], { couponCode: coupon.code });
    expect((await prisma.coupon.findUniqueOrThrow({ where: { id: coupon.id } })).timesUsed).toBe(0);
    await markOrderPaid({ orderId: res.json.data._id });
    await markOrderPaid({ orderId: res.json.data._id });
    expect((await prisma.coupon.findUniqueOrThrow({ where: { id: coupon.id } })).timesUsed).toBe(1);
  });

  it("CPN-019 an invalid coupon blocks the order", async () => {
    const expired = await createCoupon({ validFrom: new Date(Date.now() - 2 * day), validTo: new Date(Date.now() - day) });
    const before = await prisma.order.count({ where: { userId: w.customerA.id } });
    const res = await placeOrder([{ productId: w.pSesame.id, variantId: w.v1L, quantity: 1 }], { couponCode: expired.code });
    expect(res.status).toBe(400);
    expect(res.json.error).toBe("This coupon has expired");
    expect(await prisma.order.count({ where: { userId: w.customerA.id } })).toBe(before);
  });

  it("CPN-020 usage-limit race: two payments can't both take the last use without a flag", async () => {
    const coupon = await createCoupon({ usageLimit: 1 });
    const a = await placeOrder([{ productId: w.pSesame.id, variantId: w.v1L, quantity: 1 }], { couponCode: coupon.code });
    const b = await placeOrder([{ productId: w.pSesame.id, variantId: w.v1L, quantity: 1 }], { couponCode: coupon.code });
    expect(a.status).toBe(200);
    expect(b.status).toBe(200); // nothing is reserved at creation
    await Promise.all([markOrderPaid({ orderId: a.json.data._id }), markOrderPaid({ orderId: b.json.data._id })]);
    const saved = await prisma.coupon.findUniqueOrThrow({ where: { id: coupon.id } });
    expect(saved.timesUsed).toBe(2);
    const orders = await prisma.order.findMany({ where: { id: { in: [a.json.data._id, b.json.data._id] } } });
    expect(orders.filter((o) => o.notes?.includes("over its usage limit"))).toHaveLength(1);
  });
});

describe("combos", () => {
  const comboLine = () => ({ productId: w.comboLive.id, variantId: w.comboLive.id, quantity: 2 });

  it("CMB-008 a combo line is priced by the server and stored", async () => {
    const res = await placeOrder([comboLine()]);
    expect(res.status).toBe(200);
    const item = res.json.data.items[0];
    expect(item.price).toBe(600);
    expect(item.variantLabel).toContain("pSesame 1L × 2");
    expect(res.json.data.pricing.total).toBe(1200);
  });

  it("CMB-009 inactive or expired combos are unavailable", async () => {
    for (const combo of [w.comboInactive, w.comboExpired]) {
      const res = await placeOrder([{ productId: combo.id, variantId: combo.id, quantity: 1 }]);
      expect(res.status).toBe(400);
      expect(res.json.error).toBe("One or more products are unavailable");
    }
  });

  it("CMB-010 paying a combo order decrements its components (custom lines skipped)", async () => {
    const res = await placeOrder([comboLine()]);
    await markOrderPaid({ orderId: res.json.data._id });
    expect(await variantStock(w.pSesame.id, w.v1L)).toBe(6);
  });

  it("CMB-011 a combo whose components are short is rejected at order time", async () => {
    await setVariantStock(w.pSesame.id, w.v1L, 3);
    const res = await placeOrder([comboLine()]);
    expect(res.status).toBe(400);
    expect(res.json.error).toMatch(/out of stock/);
  });

  it("CMB-011 combo + the same product on another line are checked together", async () => {
    const res = await placeOrder([
      { productId: w.comboLive.id, variantId: w.comboLive.id, quantity: 4 }, // 8 x v1L
      { productId: w.pSesame.id, variantId: w.v1L, quantity: 3 },
    ]);
    expect(res.status).toBe(400);
  });

  it("CMB-012 refunding a paid combo order restores the components", async () => {
    const res = await placeOrder([comboLine()]);
    await markOrderPaid({ orderId: res.json.data._id });
    expect(await variantStock(w.pSesame.id, w.v1L)).toBe(6);
    actAs(w.admin);
    const refunded = await call(refund, { params: { id: res.json.data._id } });
    expect(refunded.status).toBe(200);
    expect(await variantStock(w.pSesame.id, w.v1L)).toBe(10);
  });

  it("CMB-006 getComboBySlug uses customPrice for custom lines", async () => {
    const result = await getComboBySlug(w.comboLive.slug.toUpperCase());
    expect(result).toBeTruthy();
    const custom = result!.lines.find((l) => l.name === "Gift box");
    expect(custom?.unitPrice).toBe(50);
    const real = result!.lines.find((l) => l.name === "pSesame");
    expect(real?.unitPrice).toBe(350);
    expect(result!.separateTotal).toBe(350 * 2 + 50);
    expect(await getComboBySlug(`${w.comboLive.slug}-typo`)).toBeNull();
  });
});
