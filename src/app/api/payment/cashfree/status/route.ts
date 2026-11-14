import { NextResponse } from "next/server";
import { USER_ROLES } from "@/constants/auth";
import { PAYMENT_ERRORS } from "@/constants/payment";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { markOrderPaid } from "@/lib/orders/mark-paid";
import { assertCashfreeCredentialsConfigured } from "@/lib/payment/cashfree-auth";
import { getCashfreeOrderStatus } from "@/lib/payment/cashfree";
import { PaymentStatus } from "@/types/order";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: PAYMENT_ERRORS.STATUS_UNAUTHORIZED },
        { status: 401 },
      );
    }

    const configured = assertCashfreeCredentialsConfigured();
    if (!configured.ok) {
      return NextResponse.json({ error: configured.error }, { status: 503 });
    }

    const body = await request.json();
    const cashfreeOrderId = body.cashfreeOrderId as string | undefined;
    if (!cashfreeOrderId) {
      return NextResponse.json(
        { error: "cashfreeOrderId required" },
        { status: 400 },
      );
    }

    const order = await prisma.order.findFirst({
      where: { cashfreeOrderId },
      select: { id: true, userId: true, paymentStatus: true },
    });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const isOwner =
      order.userId === session.user.id ||
      session.user.role === USER_ROLES.ADMIN;
    if (!isOwner) {
      return NextResponse.json(
        { error: PAYMENT_ERRORS.STATUS_FORBIDDEN },
        { status: 403 },
      );
    }

    const status = await getCashfreeOrderStatus(cashfreeOrderId);
    if (status.success) {
      await markOrderPaid({
        orderId: order.id,
        transactionId: status.paymentId,
      });
    } else if (
      status.state === "EXPIRED" ||
      status.state === "TERMINATED" ||
      status.state === "FAILED"
    ) {
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: PaymentStatus.FAILED },
      });
    }

    const refreshed = await prisma.order.findUnique({
      where: { id: order.id },
      select: { paymentStatus: true },
    });
    return NextResponse.json({
      data: {
        paymentStatus: refreshed?.paymentStatus ?? order.paymentStatus,
        state: status.state,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Status check failed" },
      { status: 500 },
    );
  }
}
