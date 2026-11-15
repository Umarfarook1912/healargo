import ExcelJS from "exceljs";
import bcrypt from "bcryptjs";
import { beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import * as adminOrders from "@/app/api/admin/orders/route";
import * as adminOrderById from "@/app/api/admin/orders/[id]/route";
import * as refund from "@/app/api/admin/orders/[id]/refund/route";
import * as tracking from "@/app/api/admin/orders/[id]/tracking/route";
import * as trackingSync from "@/app/api/admin/orders/[id]/tracking/sync/route";
import * as adminTracking from "@/app/api/admin/tracking/route";
import * as orderById from "@/app/api/orders/[id]/route";
import * as orderTracking from "@/app/api/orders/[id]/tracking/route";
import * as users from "@/app/api/admin/users/route";
import * as userById from "@/app/api/admin/users/[id]/route";
import * as usersExport from "@/app/api/admin/users/export/route";
import * as ordersExport from "@/app/api/admin/orders/export/route";
import * as productsExport from "@/app/api/admin/products/export/route";
import * as combosExport from "@/app/api/admin/combos/export/route";
import * as leads from "@/app/api/admin/whatsapp-clicks/[id]/route";
import { getOutOfStockProducts } from "@/lib/products/out-of-stock";
import { createStdWorld, type StdWorld } from "../fixtures/world";
import { createOrder, createProduct, createUser, shippingAddress, setVariantStock, TEST_PASSWORD, variantStock } from "../fixtures/factory";
import { RUN_ID, testEmail } from "../fixtures/run";
import { stCourierResultHtml } from "../helpers/fake-services";
import { call, settle } from "../helpers/http";
import { actAs } from "../helpers/session";
import { fake } from "../helpers/fake";

let w: StdWorld;
beforeAll(async () => {
  w = await createStdWorld();
});

const randomId = "00000000-0000-4000-8000-000000000000";
/** Random 11-digit AWB, practically unique even in a shared database. */
const awb = () => `9${String(Math.floor(Math.random() * 1e10)).padStart(10, "0")}`;

async function freshProduct(stock = 10) {
  return createProduct({ categoryId: w.catOils.id, variants: [{ label: "1L", price: 350, stock }] });
}

async function paidOrder(p: { id: string; variantIds: string[] }, qty = 2, extra: Parameters<typeof createOrder>[0] extends infer T ? Partial<T> : never = {}) {
  await setVariantStock(p.id, p.variantIds[0], (await variantStock(p.id, p.variantIds[0])) - qty);
  return createOrder({
    userId: w.customerA.id,
    items: [{ productId: p.id, variantId: p.variantIds[0], quantity: qty }],
    paymentStatus: "PAID",
    status: "CONFIRMED",
    stockDecremented: true,
    ...extra,
  });
}

describe("admin order create", () => {
  it("ADM-ORD-003 create uses catalog prices and keeps stock", async () => {
    actAs(w.admin);
    const p = await freshProduct();
    const res = await call(adminOrders.POST, {
      body: { shippingAddress: shippingAddress(), items: [{ productId: p.id, variantId: p.variantIds[0], quantity: 2 }], notes: `Phone order ${RUN_ID}` },
    });
    expect(res.status).toBe(200);
    const order = await prisma.order.findUniqueOrThrow({ where: { id: res.json.data._id }, include: { items: true } });
    expect(order.items[0].price).toBe(350);
    expect((order.pricing as { subtotal: number }).subtotal).toBe(700);
    expect(order).toMatchObject({ userId: null, couponCode: null, status: "PENDING", paymentStatus: "PENDING" });
    expect(await variantStock(p.id, p.variantIds[0])).toBe(10);
  });

  it("ADM-ORD-004 create as PAID decrements stock", async () => {
    actAs(w.admin);
    const p = await freshProduct();
    const res = await call(adminOrders.POST, {
      body: { shippingAddress: shippingAddress(), items: [{ productId: p.id, variantId: p.variantIds[0], quantity: 2 }], paymentStatus: "PAID", status: "CONFIRMED" },
    });
    expect(res.status).toBe(200);
    const order = await prisma.order.findUniqueOrThrow({ where: { id: res.json.data._id } });
    expect(order).toMatchObject({ paymentStatus: "PAID", status: "CONFIRMED", stockDecremented: true });
    expect(await variantStock(p.id, p.variantIds[0])).toBe(8);
  });

  it.each([
    ["missing address", (p: string, v: string) => ({ items: [{ productId: p, variantId: v, quantity: 1 }] })],
    ["quantity 0", (p: string, v: string) => ({ shippingAddress: shippingAddress(), items: [{ productId: p, variantId: v, quantity: 0 }] })],
    ["bad phone", (p: string, v: string) => ({ shippingAddress: shippingAddress({ phone: "12" }), items: [{ productId: p, variantId: v, quantity: 1 }] })],
  ])("ADM-ORD-005 rejects %s", async (_l, body) => {
    actAs(w.admin);
    const res = await call(adminOrders.POST, { body: body(w.pSesame.id, w.v1L) });
    expect(res.status).toBe(400);
    expect(res.json.error).toBe("Please check the form and try again");
  });

  it("ADM-ORD-005 rejects an out-of-stock variant", async () => {
    actAs(w.admin);
    const res = await call(adminOrders.POST, { body: { shippingAddress: shippingAddress(), items: [{ productId: w.pSesame.id, variantId: w.v5L, quantity: 1 }] } });
    expect(res.status).toBe(400);
  });
});

describe("admin order PATCH", () => {
  it("ADM-ORD-006 status change emails once", async () => {
    actAs(w.admin);
    const p = await freshProduct();
    const order = await paidOrder(p);
    expect((await call(adminOrders.PATCH, { method: "PATCH", body: { id: order.id, status: "PROCESSING" } })).status).toBe(200);
    await settle();
    expect((await call(adminOrders.PATCH, { method: "PATCH", body: { id: order.id, status: "PROCESSING" } })).status).toBe(200);
    await settle();
    const to = (order.shippingAddress as { email: string }).email;
    expect(fake().state.emails.filter((e) => e.to === to)).toHaveLength(1);
  });

  it("ADM-ORD-007 mark PAID twice decrements once", async () => {
    actAs(w.admin);
    const p = await freshProduct();
    const order = await createOrder({ items: [{ productId: p.id, variantId: p.variantIds[0], quantity: 2 }] });
    for (let i = 0; i < 2; i += 1) {
      const res = await call(adminOrders.PATCH, { method: "PATCH", body: { id: order.id, paymentStatus: "PAID", notes: `cash ${RUN_ID}` } });
      expect(res.status).toBe(200);
    }
    const saved = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(saved).toMatchObject({ paymentStatus: "PAID", status: "CONFIRMED", notes: `cash ${RUN_ID}` });
    expect(await variantStock(p.id, p.variantIds[0])).toBe(8);
  });

  it("ADM-ORD-008 cancel restores stock once", async () => {
    actAs(w.admin);
    const p = await freshProduct();
    const order = await paidOrder(p);
    await call(adminOrders.PATCH, { method: "PATCH", body: { id: order.id, status: "CANCELLED" } });
    await call(adminOrders.PATCH, { method: "PATCH", body: { id: order.id, status: "CANCELLED" } });
    expect(await variantStock(p.id, p.variantIds[0])).toBe(10);
    expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).stockDecremented).toBe(false);
  });

  it("ADM-ORD-009 REFUNDED via PATCH restores stock; unpaid orders cannot be refunded", async () => {
    actAs(w.admin);
    const p = await freshProduct();
    const order = await paidOrder(p);
    expect((await call(adminOrders.PATCH, { method: "PATCH", body: { id: order.id, paymentStatus: "REFUNDED" } })).status).toBe(200);
    expect(await variantStock(p.id, p.variantIds[0])).toBe(10);
    const unpaid = await createOrder({ items: [{ productId: p.id, variantId: p.variantIds[0], quantity: 1 }] });
    const res = await call(adminOrders.PATCH, { method: "PATCH", body: { id: unpaid.id, paymentStatus: "REFUNDED" } });
    expect(res.status).toBe(400);
    expect(res.json.error).toBe("Only paid orders can be marked as refunded");
  });

  it("ADM-ORD-010 PATCH validation", async () => {
    actAs(w.admin);
    expect((await call(adminOrders.PATCH, { method: "PATCH", body: { id: randomId, status: "LOST" } })).status).toBe(400);
    expect((await call(adminOrders.PATCH, { method: "PATCH", body: { id: randomId, status: "SHIPPED" } })).status).toBe(404);
    expect((await call(adminOrders.PATCH, { method: "PATCH", body: { id: randomId, paymentStatus: "PAID" } })).status).toBe(404);
  });

  it("ADM-ORD-011 PATCH ignores tracking fields", async () => {
    actAs(w.admin);
    const order = await createOrder({ items: [{ productId: w.pSesame.id, variantId: w.v1L, quantity: 1 }] });
    await call(adminOrders.PATCH, { method: "PATCH", body: { id: order.id, trackingNumber: "abc", courier: "x" } });
    expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).trackingNumber).toBeNull();
  });
});

describe("refund and delete", () => {
  it("ADM-ORD-012 + ADM-ORD-013 refund restores stock once", async () => {
    actAs(w.admin);
    const p = await freshProduct();
    const order = await paidOrder(p);
    expect(await variantStock(p.id, p.variantIds[0])).toBe(8);
    const res = await call(refund.POST, { params: { id: order.id } });
    expect(res.status).toBe(200);
    expect(await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).toMatchObject({ paymentStatus: "REFUNDED", status: "CANCELLED", stockDecremented: false });
    expect(await variantStock(p.id, p.variantIds[0])).toBe(10);
    expect((await call(refund.POST, { params: { id: order.id } })).status).toBe(200);
    expect(await variantStock(p.id, p.variantIds[0])).toBe(10);
  });

  it("ADM-ORD-014 unpaid orders cannot be refunded", async () => {
    actAs(w.admin);
    const order = await createOrder({ items: [{ productId: w.pSesame.id, variantId: w.v1L, quantity: 1 }] });
    const res = await call(refund.POST, { params: { id: order.id } });
    expect(res.status).toBe(400);
    expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).paymentStatus).toBe("PENDING");
  });

  it("ADM-ORD-015 refund unknown id", async () => {
    actAs(w.admin);
    const res = await call(refund.POST, { params: { id: randomId } });
    expect(res.status).toBe(404);
    expect(res.json.error).toBe("Order not found");
  });

  it("ADM-ORD-016 delete restores stock; second delete 404", async () => {
    actAs(w.admin);
    const p = await freshProduct();
    const order = await paidOrder(p);
    expect((await call(adminOrderById.DELETE, { method: "DELETE", params: { id: order.id } })).status).toBe(200);
    expect(await prisma.orderItem.count({ where: { orderId: order.id } })).toBe(0);
    expect(await variantStock(p.id, p.variantIds[0])).toBe(10);
    expect((await call(adminOrderById.DELETE, { method: "DELETE", params: { id: order.id } })).status).toBe(404);
  });
});

describe("admin tracking", () => {
  it("ADM-ORD-017 add tracking rules", async () => {
    actAs(w.admin);
    const p = await freshProduct();
    const paid = await paidOrder(p, 1);
    const pending = await createOrder({ items: [{ productId: p.id, variantId: p.variantIds[0], quantity: 1 }] });
    const used = awb();
    await paidOrder(p, 1, { trackingNumber: used, status: "SHIPPED" });
    const put = (id: string, trackingNumber: string) => call(tracking.PUT, { method: "PUT", params: { id }, body: { trackingNumber } });
    expect((await put(paid.id, "5824029233")).json.error).toMatch(/exactly 11 digits/);
    expect((await put(pending.id, awb())).json.error).toMatch(/only for paid orders/);
    const dup = await put(paid.id, used);
    expect(dup.status).toBe(409);
    const fresh = awb();
    const ok = await put(paid.id, fresh);
    expect(ok.status).toBe(200);
    expect(ok.json.data).toMatchObject({ trackingNumber: fresh, courier: "ST Courier", status: "SHIPPED" });
    const saved = await prisma.order.findUniqueOrThrow({ where: { id: paid.id } });
    expect(saved.shippedAt).not.toBeNull();
    expect(saved.trackingStatus).toBeNull();
  });

  it("ADM-ORD-018 new AWB on a delivered order keeps DELIVERED and resets the status", async () => {
    actAs(w.admin);
    const p = await freshProduct();
    const order = await paidOrder(p, 1, { status: "DELIVERED", trackingNumber: awb(), trackingLastCheckedAt: new Date() });
    await prisma.order.update({ where: { id: order.id }, data: { trackingStatus: "DELIVERED" } });
    const res = await call(tracking.PUT, { method: "PUT", params: { id: order.id }, body: { trackingNumber: awb() } });
    expect(res.status).toBe(200);
    expect(await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).toMatchObject({ status: "DELIVERED", trackingStatus: null, trackingLastCheckedAt: null });
  });

  it("ADM-ORD-019 tracking GET and DELETE", async () => {
    actAs(w.admin);
    const p = await freshProduct();
    const n = awb();
    const order = await paidOrder(p, 1, { status: "SHIPPED", trackingNumber: n });
    expect((await call(tracking.GET, { params: { id: order.id } })).json.data.trackingNumber).toBe(n);
    expect((await call(tracking.DELETE, { method: "DELETE", params: { id: order.id } })).status).toBe(200);
    expect(await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).toMatchObject({ trackingNumber: null, status: "SHIPPED" });
    expect((await call(tracking.DELETE, { method: "DELETE", params: { id: randomId } })).status).toBe(404);
  });

  it("ADM-ORD-020 manual sync marks delivered; no AWB is 502", async () => {
    actAs(w.admin);
    const p = await freshProduct();
    const n = awb();
    fake().state.stcourier.pages.set(n, stCourierResultHtml({ awb: n, status: "Delivered" }));
    const shipped = await paidOrder(p, 1, { status: "SHIPPED", trackingNumber: n });
    const res = await call(trackingSync.POST, { params: { id: shipped.id } });
    expect(res.status).toBe(200);
    expect(res.json.data).toMatchObject({ ok: true, delivered: true });
    expect((await prisma.order.findUniqueOrThrow({ where: { id: shipped.id } })).status).toBe("DELIVERED");
    const noAwb = await paidOrder(p, 1);
    expect((await call(trackingSync.POST, { params: { id: noAwb.id } })).status).toBe(502);
  });

  it("ADM-TRK-001 track any AWB", async () => {
    actAs(w.admin);
    expect((await call(adminTracking.GET, { path: "/api/admin/tracking?awb=123" })).status).toBe(400);
    const n = awb();
    fake().state.stcourier.pages.set(n, stCourierResultHtml({ awb: n, status: "In Transit" }));
    const ok = await call(adminTracking.GET, { path: `/api/admin/tracking?awb=${n}` });
    expect(ok.status).toBe(200);
    expect(ok.json.data.events.length).toBeGreaterThan(0);
    expect((await call(adminTracking.GET, { path: `/api/admin/tracking?awb=${awb()}` })).status).toBe(502);
  });
});

describe("customer order and tracking APIs", () => {
  it("ORD-001 + ORD-002 order detail auth and IDOR", async () => {
    const order = await createOrder({ userId: w.customerA.id, paymentStatus: "PAID", status: "CONFIRMED", items: [{ productId: w.pSesame.id, variantId: w.v1L, quantity: 1 }] });
    actAs(null);
    expect((await call(orderById.GET, { params: { id: order.id } })).status).toBe(401);
    actAs(w.customerA);
    expect((await call(orderById.GET, { params: { id: order.id } })).status).toBe(200);
    actAs(w.customerB);
    expect((await call(orderById.GET, { params: { id: order.id } })).status).toBe(403);
    actAs(w.admin);
    expect((await call(orderById.GET, { params: { id: order.id } })).status).toBe(200);
    expect((await call(orderById.GET, { params: { id: randomId } })).status).toBe(404);
  });

  it("TRK-001 + TRK-002 tracking auth, IDOR and not shipped", async () => {
    const n = awb();
    fake().state.stcourier.pages.set(n, stCourierResultHtml({ awb: n, status: "In Transit" }));
    const shipped = await createOrder({ userId: w.customerA.id, paymentStatus: "PAID", status: "SHIPPED", trackingNumber: n, items: [{ productId: w.pSesame.id, variantId: w.v1L, quantity: 1 }] });
    const notShipped = await createOrder({ userId: w.customerA.id, paymentStatus: "PAID", status: "CONFIRMED", items: [{ productId: w.pSesame.id, variantId: w.v1L, quantity: 1 }] });
    actAs(null);
    expect((await call(orderTracking.GET, { params: { id: shipped.id } })).status).toBe(401);
    actAs(w.customerB);
    expect((await call(orderTracking.GET, { params: { id: shipped.id } })).status).toBe(403);
    actAs(w.admin);
    expect((await call(orderTracking.GET, { params: { id: shipped.id } })).status).toBe(200);
    expect((await call(orderTracking.GET, { params: { id: randomId } })).status).toBe(404);
    actAs(w.customerA);
    const res = await call(orderTracking.GET, { params: { id: notShipped.id } });
    expect(res.status).toBe(404);
    expect(res.json.error).toBe("This order has not been shipped yet");
  });

  it("TRK-003 + TRK-004 live status is saved and cached", async () => {
    const n = awb();
    fake().state.stcourier.pages.set(
      n,
      stCourierResultHtml({
        awb: n,
        status: "In Transit",
        events: [
          { date: "11-11-2026", time: "09:00", status: "In Transit", location: "SALEM" },
          { date: "10-11-2026", time: "18:00", status: "Booked", location: "CHENNAI" },
        ],
      }),
    );
    const order = await createOrder({ userId: w.customerA.id, paymentStatus: "PAID", status: "SHIPPED", trackingNumber: n, items: [{ productId: w.pSesame.id, variantId: w.v1L, quantity: 1 }] });
    actAs(w.customerA);
    const res = await call(orderTracking.GET, { params: { id: order.id } });
    expect(res.status).toBe(200);
    expect(res.json.data).toMatchObject({ trackingNumber: n, courier: "ST Courier", status: "In Transit" });
    expect(res.json.data.events).toHaveLength(2);
    expect(new Date(res.json.data.fetchedAt).toISOString()).toBe(res.json.data.fetchedAt);
    const saved = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(saved.trackingStatus).toBe("In Transit");
    expect(saved.trackingLastCheckedAt).not.toBeNull();
    const hits = fake().state.stcourier.hits;
    await call(orderTracking.GET, { params: { id: order.id } });
    expect(fake().state.stcourier.hits).toBe(hits);
  });

  it("TRK-005 ST Courier down is 502", async () => {
    const order = await createOrder({ userId: w.customerA.id, paymentStatus: "PAID", status: "SHIPPED", trackingNumber: awb(), items: [{ productId: w.pSesame.id, variantId: w.v1L, quantity: 1 }] });
    actAs(w.customerA);
    const res = await call(orderTracking.GET, { params: { id: order.id } });
    expect(res.status).toBe(502);
    expect(res.json.error).toBe("Couldn't load live status right now");
  });

  it("TRK-006 only SHIPPED orders move to DELIVERED", async () => {
    const a = awb();
    const b = awb();
    fake().state.stcourier.pages.set(a, stCourierResultHtml({ awb: a, status: "Delivered" }));
    fake().state.stcourier.pages.set(b, stCourierResultHtml({ awb: b, status: "Delivered" }));
    const shipped = await createOrder({ userId: w.customerA.id, paymentStatus: "PAID", status: "SHIPPED", trackingNumber: a, items: [{ productId: w.pSesame.id, variantId: w.v1L, quantity: 1 }] });
    const confirmed = await createOrder({ userId: w.customerA.id, paymentStatus: "PAID", status: "CONFIRMED", trackingNumber: b, items: [{ productId: w.pSesame.id, variantId: w.v1L, quantity: 1 }] });
    actAs(w.customerA);
    await call(orderTracking.GET, { params: { id: shipped.id } });
    await call(orderTracking.GET, { params: { id: confirmed.id } });
    expect((await prisma.order.findUniqueOrThrow({ where: { id: shipped.id } })).status).toBe("DELIVERED");
    expect((await prisma.order.findUniqueOrThrow({ where: { id: confirmed.id } })).status).toBe("CONFIRMED");
  });
});

describe("admin users", () => {
  it("ADM-USR-001 list hides secrets", async () => {
    actAs(w.admin);
    const res = await call(users.GET);
    expect(res.status).toBe(200);
    const mine = res.json.data.find((u: { id: string }) => u.id === w.customerA.id);
    expect(Object.keys(mine).sort()).toEqual(expect.arrayContaining(["id", "name", "email", "role", "createdAt"]));
    expect(res.text).not.toMatch(/passwordHash|passwordReset/);
  });

  it("ADM-USR-002 create users", async () => {
    actAs(w.admin);
    const u = await call(users.POST, { body: { name: "New User", email: testEmail(), password: "secret1" } });
    expect(u.status).toBe(200);
    const a = await call(users.POST, { body: { name: "New Admin", email: testEmail(), password: "secret1", role: "admin" } });
    expect(a.json.data.role).toBe("admin");
    const dup = await call(users.POST, { body: { name: "Dup", email: w.customerA.email, password: "secret1" } });
    expect(dup.status).toBe(409);
    expect(dup.json.error).toBe("Email already registered");
    expect((await call(users.POST, { body: { name: "x" } })).status).toBe(400);
  });

  it("ADM-USR-003 change role rules", async () => {
    actAs(w.admin);
    const admin2 = await createUser({ role: "admin" });
    const customer = await createUser();
    expect((await call(users.PATCH, { method: "PATCH", body: { id: w.admin.id, role: "user" } })).json.error).toBe("You cannot change your own role");
    expect((await call(users.PATCH, { method: "PATCH", body: { id: admin2.id, role: "user" } })).status).toBe(200);
    expect((await call(users.PATCH, { method: "PATCH", body: { id: randomId, role: "user" } })).status).toBe(404);
    expect((await call(users.PATCH, { method: "PATCH", body: { id: customer.id, role: "admin" } })).status).toBe(200);
  });

  it("ADM-USR-004 edit user", async () => {
    actAs(w.admin);
    const target = await createUser();
    const other = await createUser();
    expect((await call(userById.PUT, { method: "PUT", params: { id: target.id }, body: { email: other.email.toUpperCase() } })).status).toBe(409);
    expect((await call(userById.PUT, { method: "PUT", params: { id: target.id }, body: { password: "brandnew1" } })).status).toBe(200);
    const saved = await prisma.user.findUniqueOrThrow({ where: { id: target.id } });
    expect(await bcrypt.compare("brandnew1", saved.passwordHash!)).toBe(true);
    expect(await bcrypt.compare(TEST_PASSWORD, saved.passwordHash!)).toBe(false);
    expect((await call(userById.PUT, { method: "PUT", params: { id: w.admin.id }, body: { role: "user" } })).status).toBe(400);
  });

  it("ADM-USR-005 delete user keeps their orders and reviews", async () => {
    actAs(w.admin);
    expect((await call(userById.DELETE, { method: "DELETE", params: { id: w.admin.id } })).json.error).toBe("You cannot delete your own account");
    const doomed = await createUser();
    const order = await createOrder({ userId: doomed.id, items: [{ productId: w.pSesame.id, variantId: w.v1L, quantity: 1 }] });
    const review = await prisma.review.create({ data: { productId: w.pSesame.id, userId: doomed.id, authorName: `R ${RUN_ID}`, rating: 4, body: "Good oil" } });
    expect((await call(userById.DELETE, { method: "DELETE", params: { id: doomed.id } })).status).toBe(200);
    expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).userId).toBeNull();
    expect((await prisma.review.findUniqueOrThrow({ where: { id: review.id } })).userId).toBeNull();
  });
});

async function readWorkbook(res: Response) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await res.arrayBuffer());
  return wb;
}
function sheetText(ws: ExcelJS.Worksheet) {
  const rows: unknown[][] = [];
  ws.eachRow((row) => rows.push((row.values as unknown[]).slice(1)));
  return rows;
}

describe("exports", () => {
  it("ADM-EXP-001 orders export: by ids", async () => {
    actAs(w.admin);
    const a = await createOrder({ paymentStatus: "PAID", status: "CONFIRMED", items: [{ productId: w.pSesame.id, variantId: w.v1L, quantity: 1 }] });
    const b = await createOrder({ paymentStatus: "PENDING", items: [{ productId: w.pSesame.id, variantId: w.v1L, quantity: 1 }] });
    const res = await call(ordersExport.POST, { body: { orderIds: [a.id, b.id] } });
    expect(res.status).toBe(200);
    expect(res.response.headers.get("content-type")).toMatch(/spreadsheetml/);
    expect(res.response.headers.get("content-disposition")).toMatch(/Healargo_Orders_.*\.xlsx/);
    const wb = await readWorkbook(res.response);
    const ws = wb.getWorksheet("Orders")!;
    expect(ws).toBeTruthy();
    const flat = JSON.stringify(sheetText(ws));
    expect(flat).toContain("PAID");
    expect(flat).toContain("PENDING");
  });

  it("ADM-EXP-002 users export counts PAID spend only", async () => {
    actAs(w.admin);
    const buyer = await createUser();
    await createOrder({ userId: buyer.id, paymentStatus: "PAID", status: "CONFIRMED", total: 630, items: [{ productId: w.pSesame.id, variantId: w.v1L, quantity: 1, price: 630 }] });
    await createOrder({ userId: buyer.id, paymentStatus: "REFUNDED", status: "CANCELLED", total: 1000, items: [{ productId: w.pSesame.id, variantId: w.v1L, quantity: 1, price: 1000 }] });
    const res = await call(usersExport.POST, { body: { userIds: [buyer.id] } });
    expect(res.status).toBe(200);
    const wb = await readWorkbook(res.response);
    const rows = sheetText(wb.worksheets[0]);
    const row = rows.find((r) => JSON.stringify(r).includes(buyer.email))!;
    expect(row).toBeTruthy();
    const numbers = row.filter((v) => typeof v === "number");
    expect(numbers).toContain(630);
    expect(numbers).not.toContain(1630);
  });

  it("ADM-EXP-003 + ADM-EXP-004 products and combos export", async () => {
    actAs(w.admin);
    const p = await call(productsExport.POST, { body: { productIds: [w.pSesame.id] } });
    expect(p.status).toBe(200);
    expect(JSON.stringify(sheetText((await readWorkbook(p.response)).worksheets[0]))).toContain("1L");
    const c = await call(combosExport.POST, { body: { comboIds: [w.comboLive.id] } });
    expect(c.status).toBe(200);
    expect((await readWorkbook(c.response)).worksheets.length).toBeGreaterThan(0);
  });
});

describe("dashboard and leads", () => {
  it("ADM-DSH-003 out-of-stock widget checks every active product", async () => {
    const list = await getOutOfStockProducts();
    expect(list.length).toBeLessThanOrEqual(5);
    // pSesame (5L stock 0) is older than many newer products created by other tests.
    for (let i = 0; i < 13; i += 1) await freshProduct();
    const all = await getOutOfStockProducts();
    const ids = JSON.stringify(all);
    expect(all.length === 5 || ids.includes(w.pSesame.id)).toBe(true);
  });

  it("ADM-TRF-003 lead status update", async () => {
    actAs(w.admin);
    const lead = await prisma.whatsAppClick.create({
      data: { context: "product", pagePath: `/p/${RUN_ID}`, items: [], estimatedTotal: 0, sessionKey: `${RUN_ID}-lead` },
    });
    expect((await call(leads.PATCH, { method: "PATCH", params: { id: lead.id }, body: { status: "CONTACTED" } })).status).toBe(200);
    expect((await call(leads.PATCH, { method: "PATCH", params: { id: lead.id }, body: { status: "WON" } })).status).toBe(400);
    const missing = await call(leads.PATCH, { method: "PATCH", params: { id: randomId }, body: { status: "CONTACTED" } });
    expect(missing.status).toBe(404);
    expect(missing.json.error).toBe("WhatsApp lead not found");
  });
});
