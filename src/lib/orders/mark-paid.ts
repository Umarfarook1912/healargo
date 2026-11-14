import { mapOrder } from "@/lib/db/orders";
import { prisma } from "@/lib/db/prisma";
import { PaymentStatus, OrderStatus } from "@/types/order";
import { decrementStockForItems } from "@/lib/orders/inventory";
import {
  sendAdminNewOrderEmail,
  sendOrderConfirmationEmail,
} from "@/lib/email/send";

type MarkPaidInput = {
  orderId: string;
  transactionId?: string;
};

export async function markOrderPaid(input: MarkPaidInput) {
  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    include: { items: true, user: true },
  });
  if (!order) return null;

  const wasPaid = order.paymentStatus === PaymentStatus.PAID;

  if (!wasPaid && !order.stockDecremented) {
    await decrementStockForItems(
      order.items.map((item) => ({
        productId: item.productId,
        variantId: String(item.variantId),
        quantity: item.quantity,
      })),
    );
  }

  const updated = await prisma.order.update({
    where: { id: input.orderId },
    data: {
      paymentStatus: PaymentStatus.PAID,
      status: OrderStatus.CONFIRMED,
      cashfreePaymentId: input.transactionId ?? order.cashfreePaymentId,
      stockDecremented: !wasPaid ? true : order.stockDecremented,
    },
    include: { items: true, user: true },
  });
  const mapped = mapOrder(updated);

  if (!wasPaid) {
    void sendOrderConfirmationEmail(mapped).catch(() => undefined);
    void sendAdminNewOrderEmail(mapped).catch(() => undefined);
  }

  return mapped;
}
