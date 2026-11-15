import { NextResponse } from "next/server";
import { PAYMENT_ERRORS } from "@/constants/payment";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { isAdminSession } from "@/lib/auth/require-admin";
import { assertCashfreeCredentialsConfigured } from "@/lib/payment/cashfree-auth";
import {
  findOrderByCashfreeOrderId,
  syncOrderWithCashfree,
} from "@/lib/payment/order-sync";

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

    const order = await findOrderByCashfreeOrderId(cashfreeOrderId, {
      id: true,
      userId: true,
      paymentStatus: true,
    });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const isOwner =
      order.userId === session.user.id || (await isAdminSession(session));
    if (!isOwner) {
      return NextResponse.json(
        { error: PAYMENT_ERRORS.STATUS_FORBIDDEN },
        { status: 403 },
      );
    }

    const status = await syncOrderWithCashfree(order.id, cashfreeOrderId);

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
