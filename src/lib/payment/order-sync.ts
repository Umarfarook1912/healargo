import type { Prisma } from "@prisma/client";
import { CASHFREE_ORDER_STATUS } from "@/constants/payment";
import { prisma } from "@/lib/db/prisma";
import { markOrderPaid } from "@/lib/orders/mark-paid";
import { getCashfreeOrderStatus } from "@/lib/payment/cashfree";
import { PaymentStatus } from "@/types/order";

const FAILED_STATES = new Set<string>([
  CASHFREE_ORDER_STATUS.EXPIRED,
  CASHFREE_ORDER_STATUS.TERMINATED,
  "FAILED",
]);

/** Our Cashfree order ids look like `HG-<last 10 chars of order id>-<6 digits>`. */
export function orderIdSuffixFromCashfreeId(cashfreeOrderId: string): string | null {
  const match = /^HG-([A-Za-z0-9]{6,10})-\d{6}$/.exec(cashfreeOrderId.trim());
  return match?.[1] ?? null;
}

/**
 * Finds the order for a Cashfree order id. A retried payment stores a new id
 * on the order, so an earlier session (second tab, back button) is matched by
 * the order-id suffix embedded in it instead of returning 404 and losing a
 * captured payment.
 */
export async function findOrderByCashfreeOrderId<S extends Prisma.OrderSelect>(
  cashfreeOrderId: string,
  select: S,
) {
  const direct = await prisma.order.findFirst({
    where: { cashfreeOrderId },
    select,
  });
  if (direct) return direct;

  const suffix = orderIdSuffixFromCashfreeId(cashfreeOrderId);
  if (!suffix) return null;
  const candidates = await prisma.order.findMany({
    where: { id: { endsWith: suffix } },
    select,
    take: 2,
  });
  return candidates.length === 1 ? candidates[0] : null;
}

/**
 * Marks a payment attempt as failed without ever downgrading a PAID or
 * REFUNDED order, and only for the order's current Cashfree session (a stale
 * session expiring must not fail a newer attempt).
 */
export async function markPaymentFailed(orderId: string, cashfreeOrderId?: string) {
  const result = await prisma.order.updateMany({
    where: {
      id: orderId,
      paymentStatus: PaymentStatus.PENDING,
      ...(cashfreeOrderId ? { cashfreeOrderId } : {}),
    },
    data: { paymentStatus: PaymentStatus.FAILED },
  });
  return result.count > 0;
}

/** Asks Cashfree for the session's status and applies it to the order. */
export async function syncOrderWithCashfree(orderId: string, cashfreeOrderId: string) {
  const status = await getCashfreeOrderStatus(cashfreeOrderId);
  if (status.success) {
    await markOrderPaid({ orderId, transactionId: status.paymentId });
  } else if (status.state && FAILED_STATES.has(status.state)) {
    await markPaymentFailed(orderId, cashfreeOrderId);
  }
  return status;
}
