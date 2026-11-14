import { ATTRIBUTION_COPY } from "@/constants/attribution";
import { WHATSAPP_LEAD_LIMITS } from "@/constants/whatsapp-leads";
import { formatAttributionLine } from "@/lib/attribution/labels";
import { prisma } from "@/lib/db/prisma";
import type { CampaignAttribution } from "@/types/attribution";
import {
  WhatsAppLeadContext,
  WhatsAppLeadStatus,
  type WhatsAppLeadItem,
  type WhatsAppLeadRow,
  type WhatsAppLeadSummary,
  type WhatsAppProductStat,
} from "@/types/whatsapp-lead";

function toIso(value: Date | string | null | undefined): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return new Date().toISOString();
}

function productKey(item: WhatsAppLeadItem): string {
  return (item.productId || item.name).trim();
}

function summarizeItems(items: WhatsAppLeadItem[]): string {
  if (!items.length) return ATTRIBUTION_COPY.empty;
  const first = items[0];
  const head = first.variantLabel
    ? `${first.name} (${first.variantLabel}) × ${first.quantity}`
    : `${first.name} × ${first.quantity}`;
  if (items.length === 1) return head;
  return `${head} +${items.length - 1} more`;
}

export async function getWhatsAppLeadSummary(): Promise<WhatsAppLeadSummary> {
  const [clicks, open, ordered] = await Promise.all([
    prisma.whatsAppClick.count(),
    prisma.whatsAppClick.count({
      where: {
        status: {
          in: [WhatsAppLeadStatus.NEW, WhatsAppLeadStatus.CONTACTED],
        },
      },
    }),
    prisma.whatsAppClick.count({
      where: { status: WhatsAppLeadStatus.ORDERED },
    }),
  ]);
  return { clicks, open, ordered };
}

export async function getWhatsAppProductStats(): Promise<WhatsAppProductStat[]> {
  const leads = await prisma.whatsAppClick.findMany({
    select: { status: true, items: true, createdAt: true },
  });

  const stats = new Map<
    string,
    { name: string; clicks: number; ordered: number; open: number; lastClickAt: Date }
  >();

  for (const lead of leads) {
    const items = (
      Array.isArray(lead.items) ? lead.items : []
    ) as unknown as WhatsAppLeadItem[];
    const isOrdered = lead.status === WhatsAppLeadStatus.ORDERED;
    const isOpen =
      lead.status === WhatsAppLeadStatus.NEW ||
      lead.status === WhatsAppLeadStatus.CONTACTED;

    for (const item of items) {
      const key = productKey(item) || item.name;
      if (!key) continue;
      const current = stats.get(key) ?? {
        name: item.name || key,
        clicks: 0,
        ordered: 0,
        open: 0,
        lastClickAt: lead.createdAt,
      };
      current.clicks += 1;
      if (isOrdered) current.ordered += 1;
      if (isOpen) current.open += 1;
      if (lead.createdAt > current.lastClickAt) {
        current.lastClickAt = lead.createdAt;
      }
      if (!current.name && item.name) current.name = item.name;
      stats.set(key, current);
    }
  }

  return [...stats.entries()]
    .map(([key, row]) => ({
      key,
      name: row.name || key,
      clicks: row.clicks,
      ordered: row.ordered,
      open: row.open,
      lastClickAt: toIso(row.lastClickAt),
    }))
    .sort(
      (a, b) =>
        b.clicks - a.clicks ||
        b.lastClickAt.localeCompare(a.lastClickAt),
    )
    .slice(0, WHATSAPP_LEAD_LIMITS.topProducts);
}

export async function getRecentWhatsAppLeads(): Promise<WhatsAppLeadRow[]> {
  const leads = await prisma.whatsAppClick.findMany({
    orderBy: { createdAt: "desc" },
    take: WHATSAPP_LEAD_LIMITS.recentItems,
  });

  return leads.map((lead) => {
    const attribution = lead.attribution as CampaignAttribution | null;
    const items = (
      Array.isArray(lead.items) ? lead.items : []
    ) as unknown as WhatsAppLeadItem[];
    return {
      id: lead.id,
      status: (lead.status as WhatsAppLeadStatus) ?? WhatsAppLeadStatus.NEW,
      context:
        (lead.context as WhatsAppLeadContext) ?? WhatsAppLeadContext.PRODUCT,
      pagePath: String(lead.pagePath ?? ATTRIBUTION_COPY.empty),
      itemsSummary: summarizeItems(items),
      productKeys: [...new Set(items.map(productKey).filter(Boolean))],
      estimatedTotal: Number(lead.estimatedTotal) || 0,
      customer: lead.userName || WHATSAPP_LEAD_LIMITS.guestLabel,
      userEmail: lead.userEmail || undefined,
      attributionLine: formatAttributionLine(attribution ?? undefined),
      createdAt: toIso(lead.createdAt),
    };
  });
}
