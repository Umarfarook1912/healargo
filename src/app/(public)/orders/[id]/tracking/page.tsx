import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ShipmentTrackingView } from "@/components/features/shipping/ShipmentTrackingView";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { API_ENDPOINTS } from "@/constants/api";
import { ROUTES } from "@/constants/routes";
import { auth } from "@/lib/auth/auth";
import { isAdminSession } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/db/prisma";
import { isDbId } from "@/lib/db/serialize";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function OrderTrackingPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    redirect(`${ROUTES.LOGIN}?callbackUrl=${ROUTES.ORDER_TRACKING(id)}`);
  }
  if (!isDbId(id)) notFound();

  const order = await prisma.order.findUnique({
    where: { id },
    select: { id: true, userId: true, trackingNumber: true },
  });
  if (!order) notFound();

  const isOwner =
    String(order.userId ?? "") === session.user.id ||
    (await isAdminSession(session));
  if (!isOwner) notFound();

  const orderId = order.id;
  const shortId = `VSO-${orderId.slice(-6).toUpperCase()}`;

  return (
    <PageContainer className="py-10 md:py-14">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-6">
        <div>
          <p className="eyebrow">Shipment tracking</p>
          <h1 className="mt-2 font-display text-3xl text-dark md:text-4xl">Track order #{shortId}</h1>
          <p className="mt-1 text-sm text-muted">Live shipment status from ST Courier</p>
        </div>
        <Button variant="outline" size="sm" asChild className="gap-2">
          <Link href={ROUTES.ORDER_DETAIL(orderId)}>
            <ArrowLeft className="h-4 w-4" /> Back to order
          </Link>
        </Button>
      </div>

      <div className="mt-8">
        {order.trackingNumber ? (
          <ShipmentTrackingView
            endpoint={API_ENDPOINTS.ORDER_TRACKING(orderId)}
            trackingNumber={order.trackingNumber}
          />
        ) : (
          <div className="rounded-3xl border border-dashed border-border bg-card/70 px-6 py-14 text-center text-sm text-muted">
            Your order hasn&apos;t been shipped yet. Tracking details will appear here once it is
            handed to the courier.
          </div>
        )}
      </div>
    </PageContainer>
  );
}