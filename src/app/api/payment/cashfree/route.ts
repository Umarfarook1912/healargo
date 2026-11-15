import { NextResponse } from "next/server";
import { z } from "zod";
import { COUPON_ERRORS } from "@/constants/coupons";
import { CASHFREE_ORDER_STATUS, PAYMENT_ERRORS } from "@/constants/payment";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { checkStockForItems } from "@/lib/orders/inventory";
import { markOrderPaid } from "@/lib/orders/mark-paid";
import {
  assertCashfreeCredentialsConfigured,
  getCashfreeMode,
} from "@/lib/payment/cashfree-auth";
import {
  createCashfreePayment,
  getCashfreeOrderStatus,
} from "@/lib/payment/cashfree";
import { resolveSiteUrl } from "@/lib/payment/site-url";
import { OrderStatus, PaymentStatus } from "@/types/order";
import type { ShippingAddress } from "@/types/user";

const schema = z.object({
  orderId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid orderId" }, { status: 400 });
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const configured = assertCashfreeCredentialsConfigured();
    if (!configured.ok) {
      return NextResponse.json({ error: configured.error }, { status: 503 });
    }

    const order = await prisma.order.findUnique({
      where: { id: parsed.data.orderId },
      select: {
        id: true,
        userId: true,
        pricing: true,
        shippingAddress: true,
        cashfreeOrderId: true,
        paymentStatus: true,
        status: true,
        couponCode: true,
        items: { select: { productId: true, variantId: true, quantity: true } },
      },
    });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (order.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (
      order.paymentStatus === PaymentStatus.PAID ||
      order.paymentStatus === PaymentStatus.REFUNDED
    ) {
      return NextResponse.json(
        { error: PAYMENT_ERRORS.ALREADY_PAID, data: { paymentStatus: order.paymentStatus } },
        { status: 409 },
      );
    }
    if (order.status === OrderStatus.CANCELLED) {
      return NextResponse.json({ error: PAYMENT_ERRORS.ORDER_CANCELLED }, { status: 409 });
    }

    // A retry must not lose an earlier session: if it was paid (second tab,
    // back button) record that payment; if it is still open, resume it.
    if (order.cashfreeOrderId) {
      const previous = await getCashfreeOrderStatus(order.cashfreeOrderId);
      if (previous.success) {
        await markOrderPaid({ orderId: order.id, transactionId: previous.paymentId });
        return NextResponse.json(
          { error: PAYMENT_ERRORS.ALREADY_PAID, data: { paymentStatus: PaymentStatus.PAID } },
          { status: 409 },
        );
      }
      if (previous.state === CASHFREE_ORDER_STATUS.ACTIVE && previous.paymentSessionId) {
        return NextResponse.json({
          data: {
            paymentSessionId: previous.paymentSessionId,
            cashfreeOrderId: order.cashfreeOrderId,
            mode: getCashfreeMode(),
            orderId: order.id,
          },
        });
      }
    }

    // Stock is reserved when the payment succeeds, so re-check it (combos and
    // repeated variants included) before taking the customer's money.
    const stockError = await checkStockForItems(
      order.items.map((item) => ({
        productId: item.productId,
        variantId: String(item.variantId),
        quantity: item.quantity,
      })),
    );
    if (stockError) {
      return NextResponse.json({ error: stockError }, { status: 409 });
    }

    if (order.couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: order.couponCode },
        select: { usageLimit: true, timesUsed: true },
      });
      if (coupon && coupon.usageLimit > 0 && coupon.timesUsed >= coupon.usageLimit) {
        return NextResponse.json(
          { error: COUPON_ERRORS.LIMIT_REACHED },
          { status: 409 },
        );
      }
    }

    const siteUrl = resolveSiteUrl(request);
    const cashfreeOrderId = `HG-${order.id.slice(-10)}-${Date.now().toString().slice(-6)}`;
    const address = order.shippingAddress as unknown as ShippingAddress;
    const total = (order.pricing as { total?: number }).total ?? 0;

    await prisma.order.update({
      where: { id: order.id },
      data: { cashfreeOrderId },
    });

    const result = await createCashfreePayment({
      orderId: cashfreeOrderId,
      amountInr: total,
      customerId: session.user.id,
      customerPhone: address.phone,
      customerEmail: address.email || session.user.email || undefined,
      customerName: address.fullName || session.user.name || undefined,
      returnUrl: `${siteUrl}/orders/${order.id}/confirmation?order_id={order_id}`,
      notifyUrl: `${siteUrl}/api/payment/cashfree/webhook`,
    });

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error || PAYMENT_ERRORS.INIT_FAILED },
        { status: 502 },
      );
    }

    return NextResponse.json({
      data: {
        paymentSessionId: result.paymentSessionId,
        cashfreeOrderId: result.cashfreeOrderId,
        mode: result.mode,
        orderId: order.id,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payment failed" },
      { status: 500 },
    );
  }
}
