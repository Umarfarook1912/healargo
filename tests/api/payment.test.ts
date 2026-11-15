/* eslint-disable @typescript-eslint/no-explicit-any -- loose JSON in test helpers */
import { beforeAll, beforeEach, describe, expect, it, test } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { markOrderPaid } from "@/lib/orders/mark-paid";
import { POST as createPayment } from "@/app/api/payment/cashfree/route";
import { POST as paymentStatus } from "@/app/api/payment/cashfree/status/route";
import { POST as webhook } from "@/app/api/payment/cashfree/webhook/route";
import { POST as createOrderRoute } from "@/app/api/orders/route";
import { createOrder, createCoupon, setVariantStock, variantStock, shippingAddress } from "../fixtures/factory";
import { createStdWorld, type StdWorld } from "../fixtures/world";
import { call, settle, signWebhook, webhookBody } from "../helpers/http";
import { actAs } from "../helpers/session";
import { fake } from "../helpers/fake";

let w: StdWorld;

beforeAll(async () => {
  w = await createStdWorld();
});

beforeEach(async () => {
  await setVariantStock(w.pSesame.id, w.v1L, 10);
});

async function pendingOrderA(qty = 2, extra: Parameters<typeof createOrder>[0] extends infer T ? Partial<T> : never = {}) {
  return createOrder({
    userId: w.customerA.id,
    items: [{ productId: w.pSesame.id, variantId: w.v1L, quantity: qty }],
    ...extra,
  });
}

async function startPayment(orderId: string) {
  actAs(w.customerA);
  return call(createPayment, { body: { orderId } });
}

async function sendWebhook(body: string, headers = signWebhook(body)) {
  return call(webhook, { rawBody: body, headers });
}

describe("create payment (POST /api/payment/cashfree)", () => {
  it("PAY-001 requires login and an orderId", async () => {
    actAs(null);
    expect((await call(createPayment, { body: { orderId: "x" } })).status).toBe(401);
    actAs(w.customerA);
    const res = await call(createPayment, { body: {} });
    expect(res.status).toBe(400);
    expect(res.json.error).toBe("Invalid orderId");
  });

  it("PAY-002 returns 503 when Cashfree credentials are missing", async () => {
    const order = await pendingOrderA();
    const saved = process.env.CASHFREE_APP_ID;
    process.env.CASHFREE_APP_ID = "";
    try {
      const res = await startPayment(order.id);
      expect(res.status).toBe(503);
      expect(res.json.error).toMatch(/Cashfree credentials are not configured/);
    } finally {
      process.env.CASHFREE_APP_ID = saved;
    }
  });

  it("PAY-003 IDOR: another customer's order is forbidden, unknown is 404", async () => {
    const orderB = await createOrder({ userId: w.customerB.id, items: [{ productId: w.pSesame.id, variantId: w.v1L, quantity: 1 }] });
    const res = await startPayment(orderB.id);
    expect(res.status).toBe(403);
    expect(res.json.error).toBe("Forbidden");
    const after = await prisma.order.findUniqueOrThrow({ where: { id: orderB.id } });
    expect(after.cashfreeOrderId).toBeNull();
    expect((await startPayment("does-not-exist")).status).toBe(404);
  });

  it("PAY-004 creates a Cashfree order with the right amount, phone and URLs", async () => {
    const order = await pendingOrderA(2, { total: 630 });
    const res = await startPayment(order.id);
    expect(res.status).toBe(200);
    expect(res.json.data).toMatchObject({ mode: "sandbox", orderId: order.id });
    expect(res.json.data.paymentSessionId).toMatch(/^session_HG-/);
    const sent = fake().state.cashfree.requests.find((r) => r.method === "POST")!.body as any;
    expect(sent.order_amount).toBe(630);
    expect(sent.order_currency).toBe("INR");
    expect(sent.customer_details.customer_phone).toBe("9876543210");
    expect(sent.order_meta.return_url).toBe(
      `http://localhost:3100/orders/${order.id}/confirmation?order_id={order_id}`,
    );
    expect(sent.order_meta.notify_url).toBe("http://localhost:3100/api/payment/cashfree/webhook");
    const saved = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(saved.cashfreeOrderId).toBe(res.json.data.cashfreeOrderId);
  });

  it("PAY-005 maps a Cashfree error to 502", async () => {
    const order = await pendingOrderA();
    fake().state.cashfree.createFailure = { status: 400, body: { message: "bad phone" } };
    const res = await startPayment(order.id);
    expect(res.status).toBe(502);
    expect(res.json.error).toBe("bad phone");
  });

  it.each(["PAID", "REFUNDED"] as const)("PAY-006 refuses to charge a %s order again", async (paymentStatus) => {
    const order = await pendingOrderA(1, { paymentStatus, status: "CONFIRMED" });
    const res = await startPayment(order.id);
    expect(res.status).toBe(409);
    expect(fake().state.cashfree.requests.filter((r) => r.method === "POST")).toHaveLength(0);
  });

  it("PAY-006 refuses to charge a CANCELLED order", async () => {
    const order = await pendingOrderA(1, { status: "CANCELLED" });
    const res = await startPayment(order.id);
    expect(res.status).toBe(409);
  });

  it("PAY-007 a retry resumes the open session instead of orphaning it", async () => {
    const order = await pendingOrderA();
    const first = await startPayment(order.id);
    const second = await startPayment(order.id);
    expect(second.status).toBe(200);
    expect(second.json.data.cashfreeOrderId).toBe(first.json.data.cashfreeOrderId);
    expect(second.json.data.paymentSessionId).toBe(first.json.data.paymentSessionId);
    expect(fake().state.cashfree.orders.size).toBe(1);
  });

  it("PAY-007 a webhook for an earlier (replaced) session still marks the order PAID", async () => {
    const order = await pendingOrderA();
    const first = await startPayment(order.id);
    const idX = first.json.data.cashfreeOrderId as string;
    // The first session expires, so a retry creates session Y.
    fake().state.cashfree.orders.get(idX)!.order_status = "EXPIRED";
    await new Promise((r) => setTimeout(r, 5)); // distinct Date.now() suffix
    const second = await startPayment(order.id);
    const idY = second.json.data.cashfreeOrderId as string;
    expect(idY).not.toBe(idX);
    // ...but the customer had actually paid on X in another tab.
    const res = await sendWebhook(webhookBody({ cashfreeOrderId: idX }));
    expect(res.status).toBe(200);
    const saved = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(saved.paymentStatus).toBe("PAID");
    expect(await variantStock(w.pSesame.id, w.v1L)).toBe(8);
  });

  it("PAY-007 a retry after the earlier session was paid records it and returns 409", async () => {
    const order = await pendingOrderA();
    const first = await startPayment(order.id);
    fake().state.cashfree.orders.get(first.json.data.cashfreeOrderId)!.order_status = "PAID";
    const res = await startPayment(order.id);
    expect(res.status).toBe(409);
    const saved = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(saved.paymentStatus).toBe("PAID");
    expect(fake().state.cashfree.orders.size).toBe(1);
  });

  it("PAY-026 re-checks stock before taking the payment", async () => {
    const order = await pendingOrderA(5);
    await setVariantStock(w.pSesame.id, w.v1L, 3);
    const res = await startPayment(order.id);
    expect(res.status).toBe(409);
    expect(res.json.error).toMatch(/out of stock/);
  });

  it("CPN-020 refuses payment when the coupon's limit was used up meanwhile", async () => {
    const coupon = await createCoupon({ usageLimit: 1, timesUsed: 1 });
    const order = await pendingOrderA(1, { couponCode: coupon.code });
    const res = await startPayment(order.id);
    expect(res.status).toBe(409);
    expect(res.json.error).toMatch(/maximum usage limit/);
  });
});

describe("status sync (POST /api/payment/cashfree/status)", () => {
  async function orderWithSession(userId = w.customerA.id) {
    const order = await createOrder({
      userId,
      items: [{ productId: w.pSesame.id, variantId: w.v1L, quantity: 2 }],
    });
    actAs(userId === w.customerA.id ? w.customerA : w.customerB);
    const pay = await call(createPayment, { body: { orderId: order.id } });
    return { order, cfId: pay.json.data.cashfreeOrderId as string };
  }

  it("PAY-012 auth, body, ownership", async () => {
    const { cfId } = await orderWithSession(w.customerB.id);
    actAs(null);
    expect((await call(paymentStatus, { body: { cashfreeOrderId: cfId } })).status).toBe(401);
    actAs(w.customerA);
    expect((await call(paymentStatus, { body: {} })).status).toBe(400);
    expect((await call(paymentStatus, { body: { cashfreeOrderId: "HG-nope-000000" } })).status).toBe(404);
    expect((await call(paymentStatus, { body: { cashfreeOrderId: cfId } })).status).toBe(403);
    actAs(w.admin);
    expect((await call(paymentStatus, { body: { cashfreeOrderId: cfId } })).status).toBe(200);
  });

  it("PAY-013 PAID marks the order paid, decrements stock and emails once", async () => {
    const { order, cfId } = await orderWithSession();
    fake().state.cashfree.orders.get(cfId)!.order_status = "PAID";
    actAs(w.customerA);
    const res = await call(paymentStatus, { body: { cashfreeOrderId: cfId } });
    expect(res.json.data).toEqual({ paymentStatus: "PAID", state: "PAID" });
    const saved = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(saved.status).toBe("CONFIRMED");
    expect(saved.stockDecremented).toBe(true);
    expect(await variantStock(w.pSesame.id, w.v1L)).toBe(8);
    await settle();
    const emails = fake().state.emails;
    expect(emails.filter((e) => e.to === process.env.ADMIN_NOTIFY_EMAIL)).toHaveLength(1);
    expect(emails.filter((e) => e.to !== process.env.ADMIN_NOTIFY_EMAIL)).toHaveLength(1);
  });

  it.each([
    ["EXPIRED", "FAILED"],
    ["TERMINATED", "FAILED"],
    ["ACTIVE", "PENDING"],
  ])("PAY-014 state %s -> paymentStatus %s", async (state, expected) => {
    const { order, cfId } = await orderWithSession();
    fake().state.cashfree.orders.get(cfId)!.order_status = state;
    actAs(w.customerA);
    const res = await call(paymentStatus, { body: { cashfreeOrderId: cfId } });
    expect(res.json.data.paymentStatus).toBe(expected);
    const saved = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(saved.paymentStatus).toBe(expected);
    expect(await variantStock(w.pSesame.id, w.v1L)).toBe(10);
  });

  it("PAY-014 an expired OLD session never fails a PAID order", async () => {
    const { order, cfId } = await orderWithSession();
    await prisma.order.update({ where: { id: order.id }, data: { paymentStatus: "PAID", status: "CONFIRMED" } });
    fake().state.cashfree.orders.get(cfId)!.order_status = "EXPIRED";
    actAs(w.customerA);
    const res = await call(paymentStatus, { body: { cashfreeOrderId: cfId } });
    expect(res.json.data.paymentStatus).toBe("PAID");
  });
});

describe("webhook (POST /api/payment/cashfree/webhook)", () => {
  async function orderWithCf(qty = 2) {
    const cfId = `HG-${Math.random().toString(36).slice(2, 12)}-123456`;
    const order = await createOrder({
      userId: w.customerA.id,
      cashfreeOrderId: cfId,
      items: [{ productId: w.pSesame.id, variantId: w.v1L, quantity: qty }],
    });
    return { order, cfId };
  }

  it("PAY-016 bad or missing signature is rejected and changes nothing", async () => {
    const { order, cfId } = await orderWithCf();
    const body = webhookBody({ cashfreeOrderId: cfId });
    expect((await call(webhook, { rawBody: body, headers: { "content-type": "application/json" } })).status).toBe(401);
    expect((await sendWebhook(body, signWebhook(body, "wrong-secret"))).status).toBe(401);
    const tampered = body.replace("SUCCESS", "SUCCES5");
    expect((await sendWebhook(tampered, signWebhook(body))).status).toBe(401);
    const saved = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(saved.paymentStatus).toBe("PENDING");
    expect(await variantStock(w.pSesame.id, w.v1L)).toBe(10);
  });

  it("PAY-017 + PAY-018 SUCCESS marks paid once; duplicates are no-ops", async () => {
    const { order, cfId } = await orderWithCf();
    const body = webhookBody({ cashfreeOrderId: cfId, cfPaymentId: 123 });
    const res = await sendWebhook(body);
    expect(res.status).toBe(200);
    expect(res.json).toEqual({ data: { ok: true } });
    let saved = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(saved).toMatchObject({ paymentStatus: "PAID", status: "CONFIRMED", cashfreePaymentId: "123", stockDecremented: true });
    expect(await variantStock(w.pSesame.id, w.v1L)).toBe(8);
    await settle();
    expect(fake().state.emails).toHaveLength(2);

    for (let i = 0; i < 3; i += 1) expect((await sendWebhook(body)).status).toBe(200);
    await settle();
    saved = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(saved.paymentStatus).toBe("PAID");
    expect(await variantStock(w.pSesame.id, w.v1L)).toBe(8);
    expect(fake().state.emails).toHaveLength(2);
  });

  it.each([
    { type: "PAYMENT_FAILED_WEBHOOK", paymentStatus: "FAILED" },
    { type: "PAYMENT_USER_DROPPED_WEBHOOK", paymentStatus: "USER_DROPPED" },
    { type: "SOMETHING", paymentStatus: "FAILED" },
  ])("PAY-019 $type marks FAILED, stock unchanged", async ({ type, paymentStatus }) => {
    const { order, cfId } = await orderWithCf();
    const res = await sendWebhook(webhookBody({ cashfreeOrderId: cfId, type, paymentStatus }));
    expect(res.status).toBe(200);
    const saved = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(saved.paymentStatus).toBe("FAILED");
    expect(saved.status).toBe("PENDING");
    expect(await variantStock(w.pSesame.id, w.v1L)).toBe(10);
  });

  it("PAY-019 a success after a failed attempt still marks PAID", async () => {
    const { order, cfId } = await orderWithCf();
    await sendWebhook(webhookBody({ cashfreeOrderId: cfId, type: "PAYMENT_FAILED_WEBHOOK", paymentStatus: "FAILED" }));
    await sendWebhook(webhookBody({ cashfreeOrderId: cfId }));
    const saved = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(saved.paymentStatus).toBe("PAID");
  });

  it("PAY-020 a late FAILED webhook never downgrades a PAID order", async () => {
    const { order, cfId } = await orderWithCf();
    await sendWebhook(webhookBody({ cashfreeOrderId: cfId }));
    const res = await sendWebhook(webhookBody({ cashfreeOrderId: cfId, type: "PAYMENT_FAILED_WEBHOOK", paymentStatus: "FAILED" }));
    expect(res.status).toBe(200);
    const saved = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(saved.paymentStatus).toBe("PAID");
    expect(saved.status).toBe("CONFIRMED");
  });

  it("PAY-021 bad payloads: no order_id 400, unknown 404, not JSON 500", async () => {
    const noId = JSON.stringify({ type: "PAYMENT_SUCCESS_WEBHOOK", data: { order: {} } });
    expect((await sendWebhook(noId)).status).toBe(400);
    expect((await sendWebhook(webhookBody({ cashfreeOrderId: "HG-zzzzzzzzzz-000000" }))).status).toBe(404);
    expect((await sendWebhook("not json")).status).toBe(500);
  });

  it("PAY-022 an amount mismatch is flagged on the order (money already captured)", async () => {
    const { order, cfId } = await orderWithCf(2);
    await sendWebhook(webhookBody({ cashfreeOrderId: cfId, amount: 1 }));
    const saved = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(saved.paymentStatus).toBe("PAID");
    expect(saved.notes).toMatch(/₹1 paid .* order total is ₹700/);
  });

  it("PAY-023 replaying an old signed webhook is harmless (idempotent)", async () => {
    const { order, cfId } = await orderWithCf();
    const body = webhookBody({ cashfreeOrderId: cfId });
    const oldHeaders = signWebhook(body, undefined, String(Date.now() - 2 * 86_400_000));
    await sendWebhook(body, oldHeaders);
    await sendWebhook(body, oldHeaders);
    expect(await variantStock(w.pSesame.id, w.v1L)).toBe(8);
    const saved = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(saved.paymentStatus).toBe("PAID");
  });
});

describe("markOrderPaid", () => {
  it("PAY-024 concurrent mark-paid decrements stock once and emails once", async () => {
    const cfId = `HG-${Math.random().toString(36).slice(2, 12)}-654321`;
    const order = await createOrder({
      userId: w.customerA.id,
      cashfreeOrderId: cfId,
      items: [{ productId: w.pSesame.id, variantId: w.v1L, quantity: 2 }],
    });
    fake().state.cashfree.orders.set(cfId, {
      order_id: cfId,
      order_amount: 700,
      order_status: "PAID",
      payment_session_id: "s",
      cf_order_id: 1,
    });
    actAs(w.customerA);
    const body = webhookBody({ cashfreeOrderId: cfId });
    await Promise.all([
      sendWebhook(body),
      call(paymentStatus, { body: { cashfreeOrderId: cfId } }),
      markOrderPaid({ orderId: order.id }),
      markOrderPaid({ orderId: order.id }),
    ]);
    await settle(300);
    expect(await variantStock(w.pSesame.id, w.v1L)).toBe(8);
    expect(fake().state.emails).toHaveLength(2);
  });

  it("PAY-025 unknown id returns null", async () => {
    await expect(markOrderPaid({ orderId: "nope" })).resolves.toBeNull();
  });

  it("PAY-026 stock gone by payment time: order still PAID, flagged for the admin", async () => {
    const a = await createOrder({ userId: w.customerA.id, cashfreeOrderId: `HG-a${Date.now()}-111111`, items: [{ productId: w.pSesame.id, variantId: w.v1L, quantity: 10 }] });
    const b = await createOrder({ userId: w.customerB.id, items: [{ productId: w.pSesame.id, variantId: w.v1L, quantity: 10 }] });
    await markOrderPaid({ orderId: b.id });
    expect(await variantStock(w.pSesame.id, w.v1L)).toBe(0);
    const res = await sendWebhook(webhookBody({ cashfreeOrderId: a.cashfreeOrderId! }));
    expect(res.status).toBe(200);
    const saved = await prisma.order.findUniqueOrThrow({ where: { id: a.id } });
    expect(saved.paymentStatus).toBe("PAID");
    expect(saved.stockDecremented).toBe(false);
    expect(saved.notes).toMatch(/stock could not be reserved/i);
    expect(await variantStock(w.pSesame.id, w.v1L)).toBe(0);
  });

  it("PAY-027 a partial stock failure rolls back every decrement", async () => {
    const order = await createOrder({
      userId: w.customerA.id,
      items: [
        { productId: w.pSesame.id, variantId: w.v1L, quantity: 1 },
        { productId: w.pSesame.id, variantId: w.v5L, quantity: 1 },
      ],
    });
    const result = await markOrderPaid({ orderId: order.id });
    expect(result?.paymentStatus).toBe("PAID");
    expect(await variantStock(w.pSesame.id, w.v1L)).toBe(10);
    const saved = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(saved.stockDecremented).toBe(false);
  });

  it("PAY-027 never flips a REFUNDED order back to PAID", async () => {
    const order = await createOrder({ userId: w.customerA.id, paymentStatus: "REFUNDED", status: "CANCELLED", items: [{ productId: w.pSesame.id, variantId: w.v1L, quantity: 1 }] });
    const result = await markOrderPaid({ orderId: order.id });
    expect(result?.paymentStatus).toBe("REFUNDED");
    expect(await variantStock(w.pSesame.id, w.v1L)).toBe(10);
  });
});

describe("cart clearing and full API flow", () => {
  it("CHK-011/PAY-017 order -> payment -> webhook keeps coupon usage at 0 until paid", async () => {
    const coupon = await createCoupon({ usageLimit: 5 });
    actAs(w.customerA);
    const created = await call(createOrderRoute, {
      body: {
        items: [{ productId: w.pSesame.id, variantId: w.v1L, quantity: 2 }],
        shippingAddress: shippingAddress(),
        couponCode: coupon.code.toLowerCase(),
      },
    });
    expect(created.status).toBe(200);
    expect((await prisma.coupon.findUniqueOrThrow({ where: { id: coupon.id } })).timesUsed).toBe(0);
    const pay = await call(createPayment, { body: { orderId: created.json.data._id } });
    await sendWebhook(webhookBody({ cashfreeOrderId: pay.json.data.cashfreeOrderId }));
    expect((await prisma.coupon.findUniqueOrThrow({ where: { id: coupon.id } })).timesUsed).toBe(1);
  });

  test.todo("PAY-028 customer cancels at Cashfree (covered in tests/e2e/checkout.spec.ts)");
});
