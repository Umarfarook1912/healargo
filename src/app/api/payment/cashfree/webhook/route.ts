import { NextResponse } from "next/server";
import {
  CASHFREE_ORDER_STATUS,
  CASHFREE_WEBHOOK_TYPES,
  PAYMENT_ERRORS,
} from "@/constants/payment";
import { prisma } from "@/lib/db/prisma";
import { markOrderPaid } from "@/lib/orders/mark-paid";
import {
  findOrderByCashfreeOrderId,
  markPaymentFailed,
} from "@/lib/payment/order-sync";
import { verifyCashfreeWebhookSignature } from "@/lib/payment/webhook-auth";

type WebhookBody = {
  type?: string;
  data?: {
    order?: {
      order_id?: string;
      order_status?: string;
    };
    payment?: {
      cf_payment_id?: string | number;
      payment_status?: string;
      payment_amount?: number;
    };
  };
};

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const authResult = verifyCashfreeWebhookSignature(request, rawBody);
    if (!authResult.ok) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 },
      );
    }

    const body = JSON.parse(rawBody || "{}") as WebhookBody;
    const cashfreeOrderId = body.data?.order?.order_id;
    if (!cashfreeOrderId) {
      return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
    }

    const order = await findOrderByCashfreeOrderId(cashfreeOrderId, {
      id: true,
      pricing: true,
    });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const paymentStatus = body.data?.payment?.payment_status?.toUpperCase();
    const orderStatus = body.data?.order?.order_status?.toUpperCase();
    const isSuccess =
      body.type === CASHFREE_WEBHOOK_TYPES.PAYMENT_SUCCESS ||
      paymentStatus === "SUCCESS" ||
      orderStatus === CASHFREE_ORDER_STATUS.PAID;
    const isFailed =
      body.type === CASHFREE_WEBHOOK_TYPES.PAYMENT_FAILED ||
      body.type === CASHFREE_WEBHOOK_TYPES.PAYMENT_USER_DROPPED ||
      paymentStatus === "FAILED" ||
      paymentStatus === "USER_DROPPED";

    if (isSuccess) {
      const transactionId =
        body.data?.payment?.cf_payment_id != null
          ? String(body.data.payment.cf_payment_id)
          : undefined;
      await markOrderPaid({
        orderId: order.id,
        transactionId,
      });
      // Flag (don't reject: the money is already captured) a paid amount that
      // differs from the order total, so the admin can check it in Cashfree.
      const paidAmount = Number(body.data?.payment?.payment_amount);
      const total = Number((order.pricing as { total?: number } | null)?.total);
      if (
        Number.isFinite(paidAmount) &&
        paidAmount > 0 &&
        Number.isFinite(total) &&
        Math.abs(paidAmount - total) > 0.01
      ) {
        const note = `Cashfree reported ₹${paidAmount} paid for ${cashfreeOrderId}, but the order total is ₹${total}. Please verify.`;
        const current = await prisma.order.findUnique({
          where: { id: order.id },
          select: { notes: true },
        });
        if (!current?.notes?.includes(note)) {
          await prisma.order.update({
            where: { id: order.id },
            data: { notes: [current?.notes, note].filter(Boolean).join("\n") },
          });
        }
      }
    } else if (isFailed) {
      // Never downgrades a PAID order (attempts can arrive out of order).
      await markPaymentFailed(order.id, cashfreeOrderId);
    }

    return NextResponse.json({ data: { ok: true } });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : PAYMENT_ERRORS.CALLBACK_UNAUTHORIZED,
      },
      { status: 500 },
    );
  }
}
