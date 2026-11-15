import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CashfreeStatusSync } from "@/components/features/orders/CashfreeStatusSync";
import { EstimatedDeliveryBadge } from "@/components/features/shipping/EstimatedDeliveryBadge";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/PageContainer";
import { ROUTES } from "@/constants/routes";
import { auth } from "@/lib/auth/auth";
import { isAdminSession } from "@/lib/auth/require-admin";
import { mapOrder } from "@/lib/db/orders";
import { prisma } from "@/lib/db/prisma";
import { syncOrderWithCashfree } from "@/lib/payment/order-sync";
import { formatInr } from "@/lib/utils/format";
import type { AnalyticsPurchaseItem } from "@/types/analytics";
import { PaymentStatus, type OrderItem } from "@/types/order";

type Props = { params: Promise<{ id: string }> };

export default async function OrderConfirmationPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) {
    const { id } = await params;
    redirect(
      `${ROUTES.LOGIN}?callbackUrl=${encodeURIComponent(ROUTES.ORDER_CONFIRMATION(id))}`,
    );
  }

  const { id } = await params;
  let order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, user: true },
  });
  if (!order) notFound();

  const isOwner =
    String(order.userId) === session.user.id ||
    (await isAdminSession(session));
  if (!isOwner) notFound();

  // Sync from Cashfree immediately on return (webhook may lag)
  if (
    order.cashfreeOrderId &&
    order.paymentStatus === PaymentStatus.PENDING
  ) {
    try {
      await syncOrderWithCashfree(order.id, order.cashfreeOrderId);
      order = await prisma.order.findUnique({
        where: { id },
        include: { items: true, user: true },
      });
    } catch {
      // client sync will retry
    }
  }

  if (!order) notFound();
  const data = mapOrder(order);
  const isCustomer = String(order.userId) === session.user.id;

  if (data.paymentStatus === "PAID" && !isCustomer) {
    redirect(ROUTES.PROFILE_ORDERS);
  }

  const purchaseItems: AnalyticsPurchaseItem[] = (data.items as OrderItem[]).map(
    (item) => ({
      itemId: String(item.productId),
      itemName: item.name,
      quantity: item.quantity,
      price: item.price,
    }),
  );

  return (
    <PageContainer className="py-16 text-center">
      <CashfreeStatusSync
        cashfreeOrderId={data.cashfreeOrderId}
        paymentStatus={data.paymentStatus}
        clearCartWhenPaid={isCustomer}
        purchase={
          isCustomer
            ? {
                orderId: String(data._id),
                value: data.pricing.total,
                items: purchaseItems,
              }
            : undefined
        }
      />
      <h1 className="font-display text-4xl text-dark">Thank you!</h1>
      <p className="mt-3 text-muted">
        Order <span className="font-medium text-dark">{data._id}</span> is{" "}
        {data.paymentStatus === "PAID"
          ? "confirmed"
          : "pending payment confirmation"}
        .
      </p>

      <div className="mx-auto mt-8 max-w-xl text-left">
        <EstimatedDeliveryBadge variant="order" baseDate={data.createdAt} />
      </div>

      <div className="mx-auto mt-6 max-w-xl rounded-xl border border-border bg-card p-6 text-left text-sm">
        <p className="font-semibold">Ship to</p>
        <p className="mt-1 text-muted">
          {data.shippingAddress.fullName}, {data.shippingAddress.line1},{" "}
          {data.shippingAddress.city}, {data.shippingAddress.state}{" "}
          {data.shippingAddress.pincode}
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
          <p className="font-semibold">
            Total: {formatInr(data.pricing.total)}
          </p>
          <p className="text-xs text-muted">Payment: {data.paymentStatus}</p>
        </div>
      </div>
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Button asChild>
          <Link href={ROUTES.PROFILE_ORDERS}>View my orders</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={ROUTES.SHOP}>Continue shopping</Link>
        </Button>
      </div>
    </PageContainer>
  );
}
