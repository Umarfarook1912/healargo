import { NextResponse } from "next/server";
import {
  CASHFREE_ORDER_STATUS,
  CASHFREE_WEBHOOK_TYPES,
  PAYMENT_ERRORS,
} from "@/constants/payment";
import { prisma } from "@/lib/db/prisma";
import { markOrderPaid } from "@/lib/orders/mark-paid";
import { verifyCashfreeWebhookSignature } from "@/lib/payment/webhook-auth";
import { PaymentStatus } from "@/types/order";

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

    const order = await prisma.order.findFirst({
      where: { cashfreeOrderId },
      select: { id: true },
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
    } else if (isFailed) {
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: PaymentStatus.FAILED },
      });
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
