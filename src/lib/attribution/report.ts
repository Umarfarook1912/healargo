import { ATTRIBUTION_COPY, ATTRIBUTION_SOURCE } from "@/constants/attribution";
import { formatSourceLabel } from "@/lib/attribution/labels";
import { prisma } from "@/lib/db/prisma";
import { PaymentStatus } from "@/types/order";
import type { OrderPricing } from "@/types/order";
import type { CampaignAttribution } from "@/types/attribution";
import type {
  TrafficCampaignRow,
  TrafficReport,
  TrafficSourceRow,
} from "@/types/attribution";

type GroupId = {
  source: string;
  medium: string;
  campaign: string;
  content: string;
  term: string;
  landingPath: string;
};

function groupKey(id: GroupId): string {
  return [id.source, id.medium, id.campaign, id.content, id.term, id.landingPath].join("|");
}

function display(value: string): string {
  return value || ATTRIBUTION_COPY.empty;
}

function later(left?: string, right?: Date): string | undefined {
  const rightIso = right ? new Date(right).toISOString() : undefined;
  if (!left) return rightIso;
  if (!rightIso) return left;
  return left > rightIso ? left : rightIso;
}

function emptyRow(id: GroupId): TrafficCampaignRow {
  return {
    source: id.source || ATTRIBUTION_SOURCE.direct,
    sourceLabel: formatSourceLabel(id.source),
    medium: display(id.medium),
    campaign: display(id.campaign),
    content: display(id.content),
    term: display(id.term),
    landingPath: display(id.landingPath),
    visits: 0,
    orders: 0,
    paidOrders: 0,
    revenue: 0,
  };
}

function sortRows<T extends { revenue: number; orders: number; visits: number }>(
  rows: T[],
): T[] {
  return [...rows].sort(
    (a, b) => b.revenue - a.revenue || b.orders - a.orders || b.visits - a.visits,
  );
}

function visitGroupId(visit: {
  source: string;
  medium: string;
  campaign: string;
  content: string;
  term: string;
  landingPath: string;
}): GroupId {
  return {
    source: visit.source || ATTRIBUTION_SOURCE.direct,
    medium: visit.medium || "",
    campaign: visit.campaign || "",
    content: visit.content || "",
    term: visit.term || "",
    landingPath: visit.landingPath || "",
  };
}

function orderGroupId(attribution: CampaignAttribution | null | undefined): GroupId {
  return {
    source: attribution?.source || ATTRIBUTION_SOURCE.direct,
    medium: attribution?.medium || "",
    campaign: attribution?.campaign || "",
    content: attribution?.content || "",
    term: attribution?.term || "",
    landingPath: attribution?.landingPath || "",
  };
}

export async function getTrafficReport(): Promise<TrafficReport> {
  const [visits, orders] = await Promise.all([
    prisma.marketingVisit.findMany({
      select: {
        source: true,
        medium: true,
        campaign: true,
        content: true,
        term: true,
        landingPath: true,
        createdAt: true,
      },
    }),
    prisma.order.findMany({
      select: {
        attribution: true,
        paymentStatus: true,
        pricing: true,
        createdAt: true,
      },
    }),
  ]);

  const campaigns = new Map<string, TrafficCampaignRow>();

  for (const visit of visits) {
    const id = visitGroupId(visit);
    const key = groupKey(id);
    const row = campaigns.get(key) ?? emptyRow(id);
    row.visits += 1;
    row.lastActivityAt = later(row.lastActivityAt, visit.createdAt);
    campaigns.set(key, row);
  }

  for (const order of orders) {
    const attribution = order.attribution as CampaignAttribution | null;
    const id = orderGroupId(attribution);
    const key = groupKey(id);
    const row = campaigns.get(key) ?? emptyRow(id);
    row.orders += 1;
    if (order.paymentStatus === PaymentStatus.PAID) {
      row.paidOrders += 1;
      const pricing = order.pricing as unknown as OrderPricing | null;
      row.revenue += Number(pricing?.total) || 0;
    }
    row.lastActivityAt = later(row.lastActivityAt, order.createdAt);
    campaigns.set(key, row);
  }

  const sourceMap = new Map<string, TrafficSourceRow>();
  for (const row of campaigns.values()) {
    const current = sourceMap.get(row.source) ?? {
      source: row.source,
      label: row.sourceLabel,
      visits: 0,
      orders: 0,
      paidOrders: 0,
      revenue: 0,
    };
    current.visits += row.visits;
    current.orders += row.orders;
    current.paidOrders += row.paidOrders;
    current.revenue += row.revenue;
    sourceMap.set(row.source, current);
  }

  const campaignRows = sortRows([...campaigns.values()]);
  const attributed = campaignRows.filter((row) => row.source !== ATTRIBUTION_SOURCE.direct);

  return {
    summary: {
      visits: attributed.reduce((sum, row) => sum + row.visits, 0),
      orders: attributed.reduce((sum, row) => sum + row.orders, 0),
      paidOrders: attributed.reduce((sum, row) => sum + row.paidOrders, 0),
      revenue: attributed.reduce((sum, row) => sum + row.revenue, 0),
    },
    sources: sortRows([...sourceMap.values()]),
    campaigns: campaignRows,
  };
}
