import { NextResponse } from "next/server";
import { z } from "zod";
import { PAYMENT_ERRORS } from "@/constants/payment";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { assertCashfreeCredentialsConfigured } from "@/lib/payment/cashfree-auth";
import { createCashfreePayment } from "@/lib/payment/cashfree";
import { resolveSiteUrl } from "@/lib/payment/site-url";
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
      },
    });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (order.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
