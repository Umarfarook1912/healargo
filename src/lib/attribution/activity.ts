import { ADMIN_TRAFFIC_COPY } from "@/constants/admin-traffic";
import { ATTRIBUTION_COPY, ATTRIBUTION_LIMITS } from "@/constants/attribution";
import { formatAttributionLine, formatSourceLabel } from "@/lib/attribution/labels";
import { prisma } from "@/lib/db/prisma";
import type { CampaignAttribution, TrafficOrderRow, TrafficVisitRow } from "@/types/attribution";
import type { OrderPricing } from "@/types/order";
import type { ShippingAddress } from "@/types/user";

function display(value?: string | null): string {
  return value || ATTRIBUTION_COPY.empty;
}

function toIso(value: Date | string | null | undefined): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return new Date().toISOString();
}

export async function getTrafficActivity(): Promise<{
  visits: TrafficVisitRow[];
  recentOrders: TrafficOrderRow[];
}> {
  const [visits, orders] = await Promise.all([
    prisma.marketingVisit.findMany({
      orderBy: { createdAt: "desc" },
      take: ATTRIBUTION_LIMITS.recentItems,
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: ATTRIBUTION_LIMITS.recentItems,
    }),
  ]);

  return {
    visits: visits.map((visit) => ({
      id: visit.id,
      source: String(visit.source ?? ""),
      sourceLabel: formatSourceLabel(visit.source),
      medium: display(visit.medium),
      campaign: display(visit.campaign),
      content: display(visit.content),
      term: display(visit.term),
      landingPath: display(visit.landingPath),
      createdAt: toIso(visit.createdAt),
    })),
    recentOrders: orders.map((order) => {
      const attribution = order.attribution as CampaignAttribution | null;
      const shipping = order.shippingAddress as unknown as ShippingAddress;
      const pricing = order.pricing as unknown as OrderPricing | null;
      return {
        id: order.id,
        customer: shipping?.fullName || ADMIN_TRAFFIC_COPY.customerFallback,
        sourceLabel: formatSourceLabel(attribution?.source),
        attributionLine: formatAttributionLine(attribution ?? undefined),
        total: Number(pricing?.total) || 0,
        paymentStatus: String(order.paymentStatus ?? ""),
        createdAt: toIso(order.createdAt),
      };
    }),
  };
}
