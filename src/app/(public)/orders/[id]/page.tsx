import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Package, MapPin, CreditCard, Calendar } from "lucide-react";
import { OrderDeliveredReviews } from "@/components/features/orders/OrderDeliveredReviews";
import { OrderTrackingInfo } from "@/components/features/orders/OrderTrackingInfo";
import { EstimatedDeliveryBadge } from "@/components/features/shipping/EstimatedDeliveryBadge";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/PageContainer";
import { ROUTES } from "@/constants/routes";
import { auth } from "@/lib/auth/auth";
import { isAdminSession } from "@/lib/auth/require-admin";
import { mapOrder } from "@/lib/db/orders";
import { prisma } from "@/lib/db/prisma";
import { getDeliveredReviewTargets } from "@/lib/reviews/order-reviews";
import { formatInr } from "@/lib/utils/format";
import { OrderStatus } from "@/types/order";

type Props = { params: Promise<{ id: string }> };

export default async function OrderDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) {
    redirect(`${ROUTES.LOGIN}?callbackUrl=${ROUTES.ORDERS}`);
  }

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, user: true },
  });
  if (!order) notFound();

  const data = mapOrder(order);
  const isOwner =
    (typeof data.userId === "string" ? data.userId : data.userId?._id) === session.user.id ||
    (await isAdminSession(session));
  if (!isOwner) notFound();

  const shortId = `VSO-${data._id.slice(-6).toUpperCase()}`;
  const formattedDate = data.createdAt
    ? new Date(data.createdAt).toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    : "";

  const isPaid = data.paymentStatus?.toUpperCase() === "PAID";
  const isDelivered = String(data.status).toUpperCase() === OrderStatus.DELIVERED;
  const reviewState = isDelivered ? await getDeliveredReviewTargets(session.user.id, data.items) : null;

  return (
    <PageContainer className="py-10 md:py-14">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl text-dark md:text-4xl">Order #{shortId}</h1>
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-0.5 text-xs font-bold ${isPaid
                  ? "bg-success-soft text-success border-success/25"
                  : "bg-warning-soft text-warning border-warning/30"
                }`}
            >
              {isPaid ? "PAID" : "PAYMENT PENDING"}
            </span>
          </div>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted">
            <Calendar className="h-4 w-4" /> Placed on {formattedDate} · ID: <span className="font-mono text-xs">{data._id}</span>
          </p>
        </div>

        <Button variant="outline" size="sm" asChild className="gap-2">
          <Link href={`${ROUTES.PROFILE}?tab=orders`}>
            <ArrowLeft className="h-4 w-4" /> Back to My Orders
          </Link>
        </Button>
      </div>

      <div className="mt-8 grid gap-8 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          {!isDelivered ? (
            <EstimatedDeliveryBadge variant="order" baseDate={data.createdAt} />
          ) : null}

          {data.trackingNumber ? (
            <div className="surface-card px-6 py-4">
              <OrderTrackingInfo
                orderId={data._id}
                trackingNumber={data.trackingNumber}
                trackingStatus={data.trackingStatus}
              />
            </div>
          ) : null}

          <div className="surface-card p-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h2 className="font-display text-xl text-dark flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" /> Order Items ({data.items.length})
              </h2>
              <span className="rounded-full bg-cream px-3 py-1 text-xs font-semibold text-primary">
                Status: {data.status}
              </span>
            </div>

            <div className="divide-y divide-border/60 mt-2">
              {data.items.map(
                (
                  item: {
                    name: string;
                    variantLabel: string;
                    quantity: number;
                    price: number;
                    image?: string;
                  },
                  idx: number,
                ) => {
                  const itemImg = item.image || "/images/product-placeholder.svg";
                  return (
                    <div key={idx} className="flex items-center justify-between gap-4 py-4">
                      <div className="flex items-center gap-4">
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border bg-cream p-1">
                          <Image
                            src={itemImg}
                            alt={item.name}
                            fill
                            className="object-contain"
                            sizes="64px"
                            unoptimized={itemImg.endsWith(".svg")}
                          />
                        </div>

                        <div>
                          <h3 className="font-semibold text-dark text-base">{item.name}</h3>
                          {item.variantLabel && (
                            <p className="text-xs font-medium text-muted mt-0.5">
                              Variant: <span className="text-dark font-medium">{item.variantLabel}</span>
                            </p>
                          )}
                          <p className="text-xs text-muted mt-1">
                            {formatInr(item.price)} × {item.quantity}
                          </p>
                        </div>
                      </div>

                      <div className="text-right font-display text-base text-dark font-semibold">
                        {formatInr(item.price * item.quantity)}
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </div>

          {reviewState ? (
            <OrderDeliveredReviews
              customerName={data.shippingAddress.fullName}
              items={reviewState.items}
              reviewedIds={reviewState.reviewedIds}
            />
          ) : null}

          <div className="surface-card p-6">
            <h2 className="font-display text-xl text-dark flex items-center gap-2 border-b border-border pb-4">
              <MapPin className="h-5 w-5 text-primary" /> Delivery Address
            </h2>
            <div className="mt-4 text-sm leading-relaxed text-dark">
              <p className="font-semibold text-base">{data.shippingAddress.fullName}</p>
              <p className="text-muted mt-1">{data.shippingAddress.line1}{data.shippingAddress.line2 ? `, ${data.shippingAddress.line2}` : ""}</p>
              <p className="text-muted">{data.shippingAddress.city}, {data.shippingAddress.state} - <span className="font-mono">{data.shippingAddress.pincode}</span></p>
              <p className="text-muted font-medium mt-2">Phone: {data.shippingAddress.phone}</p>
            </div>
          </div>
        </div>

        <div className="h-fit space-y-6">
          <div className="surface-card p-6 space-y-4">
            <h2 className="font-display text-xl text-dark flex items-center gap-2 border-b border-border pb-3">
              <CreditCard className="h-5 w-5 text-primary" /> Payment Summary
            </h2>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-muted">
                <span>Items Subtotal</span>
                <span className="font-medium text-dark">{formatInr(data.pricing.subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Shipping Fee</span>
                <span className="font-medium text-dark">
                  {data.pricing.shipping === 0 ? "FREE" : formatInr(data.pricing.shipping)}
                </span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Estimated Delivery</span>
                <span className="font-semibold text-primary">
                  {isDelivered ? "Delivered" : "3 to 5 Days"}
                </span>
              </div>
              <div className="flex justify-between text-muted">
                <span>GST (5%)</span>
                <span className="font-medium text-dark">Included</span>
              </div>
              {data.pricing.discount > 0 && (
                <div className="flex justify-between font-medium text-success">
                  <span>Discount</span>
                  <span>-{formatInr(data.pricing.discount)}</span>
                </div>
              )}

              <div className="border-t border-border pt-3 flex justify-between text-base font-bold text-dark">
                <span>Total Amount</span>
                <span className="text-primary font-display text-lg font-semibold">{formatInr(data.pricing.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
