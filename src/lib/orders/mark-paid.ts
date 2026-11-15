import { mapOrder } from "@/lib/db/orders";
import { prisma } from "@/lib/db/prisma";
import { PaymentStatus, OrderStatus } from "@/types/order";
import { decrementStockInTx } from "@/lib/orders/inventory";
import {
  sendAdminNewOrderEmail,
  sendOrderConfirmationEmail,
} from "@/lib/email/send";

type MarkPaidInput = {
  orderId: string;
  transactionId?: string;
  /** Send the customer and admin "new order" emails (default true). */
  notify?: boolean;
};

const PAYABLE_STATUSES = [PaymentStatus.PENDING, PaymentStatus.FAILED];

/**
 * Records a captured payment exactly once.
 *
 * The confirmation page, the client status poll and the Cashfree webhook can
 * all call this at the same moment. Only the caller whose conditional update
 * flips PENDING/FAILED -> PAID does the side effects (stock, coupon usage,
 * emails); everyone else just gets the current order back.
 *
 * A REFUNDED order is never flipped back to PAID.
 */
export async function markOrderPaid(input: MarkPaidInput) {
  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    include: { items: true, user: true },
  });
  if (!order) return null;

  if (!PAYABLE_STATUSES.includes(order.paymentStatus as PaymentStatus)) {
    return mapOrder(order);
  }

  const claimed = await prisma.order.updateMany({
    where: { id: order.id, paymentStatus: { in: PAYABLE_STATUSES } },
    data: {
      paymentStatus: PaymentStatus.PAID,
      ...(order.status === OrderStatus.PENDING
        ? { status: OrderStatus.CONFIRMED }
        : {}),
      cashfreePaymentId: input.transactionId ?? order.cashfreePaymentId,
    },
  });

  if (claimed.count === 0) {
    const current = await prisma.order.findUnique({
      where: { id: order.id },
      include: { items: true, user: true },
    });
    return current ? mapOrder(current) : null;
  }

  const notes: string[] = [];

  // The money is captured, so the order stays PAID even if stock ran out in
  // the meantime; the admin gets a note instead of the webhook failing.
  try {
    await prisma.$transaction(async (tx) => {
      const flagged = await tx.order.updateMany({
        where: { id: order.id, stockDecremented: false },
        data: { stockDecremented: true },
      });
      if (flagged.count === 0) return;
      await decrementStockInTx(
        tx,
        order.items.map((item) => ({
          productId: item.productId,
          variantId: String(item.variantId),
          quantity: item.quantity,
        })),
      );
    });
  } catch (error) {
    notes.push(
      `Paid, but stock could not be reserved automatically (${
        error instanceof Error ? error.message : "stock error"
      }). Please check inventory.`,
    );
  }

  if (order.couponCode) {
    const note = await recordCouponUse(order.couponCode);
    if (note) notes.push(note);
  }

  if (notes.length) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        notes: [order.notes, ...notes].filter(Boolean).join("\n"),
      },
    });
  }

  const updated = await prisma.order.findUniqueOrThrow({
    where: { id: order.id },
    include: { items: true, user: true },
  });
  const mapped = mapOrder(updated);

  if (input.notify !== false) {
    void sendOrderConfirmationEmail(mapped).catch(() => undefined);
    void sendAdminNewOrderEmail(mapped).catch(() => undefined);
  }

  return mapped;
}

/**
 * Counts one coupon use for a paid order. The limit is enforced atomically in
 * the UPDATE itself, so two payments can't both take the last use. If the
 * limit was already used up by the time this payment completed (the customer
 * has paid with the discount, so it can't be undone), the use is still counted
 * and a note is returned for the admin.
 */
export async function recordCouponUse(code: string): Promise<string | null> {
  const withinLimit = await prisma.coupon.updateMany({
    where: {
      code,
      OR: [
        { usageLimit: 0 },
        { timesUsed: { lt: prisma.coupon.fields.usageLimit } },
      ],
    },
    data: { timesUsed: { increment: 1 } },
  });
  if (withinLimit.count > 0) return null;

  const overLimit = await prisma.coupon.updateMany({
    where: { code },
    data: { timesUsed: { increment: 1 } },
  });
  return overLimit.count > 0
    ? `Coupon ${code} was over its usage limit when this payment completed.`
    : null;
}
