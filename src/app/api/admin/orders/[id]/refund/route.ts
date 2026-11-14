import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { mapOrder } from "@/lib/db/orders";
import { prisma } from "@/lib/db/prisma";
import { isDbId } from "@/lib/db/serialize";
import { restoreStockForItems } from "@/lib/orders/inventory";
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

    if (order.stockDecremented) {
      await restoreStockForItems(
        order.items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
        })),
      );
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        paymentStatus: PaymentStatus.REFUNDED,
        status: OrderStatus.CANCELLED,
        stockDecremented: false,
      },
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
