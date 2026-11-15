import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OrderHistoryList } from "@/components/features/orders/OrderHistoryList";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHero } from "@/components/shared/PageHero";
import { ROUTES } from "@/constants/routes";
import { auth } from "@/lib/auth/auth";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "My Orders",
  description: "Track your Healargo orders and payment status.",
  path: "/orders",
});

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user) {
    redirect(`${ROUTES.LOGIN}?callbackUrl=${ROUTES.ORDERS}`);
  }

  return (
    <>
      <PageHero eyebrow="Your account" title="My Orders" description="Track your orders, payments and deliveries in one place." />
      <PageContainer className="py-10 md:py-14">
        <OrderHistoryList />
      </PageContainer>
    </>
  );
}
