import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { mapOrder } from "@/lib/db/orders";
import { prisma } from "@/lib/db/prisma";
import { isDbId } from "@/lib/db/serialize";
import { REFUND_ERRORS } from "@/constants/payment";
import { restoreStockForOrder } from "@/lib/orders/inventory";
import { OrderStatus, PaymentStatus } from "@/types/order";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  try {
    const { id } = await params;
    if (!isDbId(id)) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true, user: true },
    });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.paymentStatus === PaymentStatus.REFUNDED) {
      return NextResponse.json({ data: mapOrder(order) });
    }

    // Refunds are manual (money is returned in the Cashfree dashboard); this
    // only records it, and only for an order that was actually paid.
    if (order.paymentStatus !== PaymentStatus.PAID) {
      return NextResponse.json({ error: REFUND_ERRORS.notPaid }, { status: 400 });
    }

    const claimed = await prisma.order.updateMany({
      where: { id, paymentStatus: PaymentStatus.PAID },
      data: {
        paymentStatus: PaymentStatus.REFUNDED,
        status: OrderStatus.CANCELLED,
      },
    });
    if (claimed.count > 0) {
      // Products and combos; the stockDecremented flag makes it run once.
      await restoreStockForOrder(id);
    }

    const updated = await prisma.order.findUniqueOrThrow({
      where: { id },
      include: { items: true, user: true },
    });

    return NextResponse.json({ data: mapOrder(updated) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Refund failed" },
      { status: 500 },
    );
  }
}
