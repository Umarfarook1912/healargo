import { prisma } from "@/lib/db/prisma";
import { isDbId } from "@/lib/db/serialize";
import type { OrderReviewTarget } from "@/types/review";

interface OrderReviewLine {
  productId?: string;
  name: string;
  variantLabel?: string;
}

export async function getDeliveredReviewTargets(
  userId: string,
  items: OrderReviewLine[],
): Promise<{ items: OrderReviewTarget[]; reviewedIds: string[] }> {
  const unique = new Map<string, OrderReviewTarget>();
  for (const item of items) {
    const productId = item.productId ? String(item.productId) : "";
    if (!isDbId(productId) || unique.has(productId)) continue;
    unique.set(productId, {
      productId,
      name: item.name,
      variantLabel: item.variantLabel ?? "",
    });
  }

  const ids = [...unique.keys()];
  if (!ids.length) return { items: [], reviewedIds: [] };

  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
    select: { id: true },
  });
  const valid = new Set(products.map((product) => product.id));
  const reviewItems = ids.flatMap((id) => {
    const target = unique.get(id);
    return valid.has(id) && target ? [target] : [];
  });
  if (!reviewItems.length) return { items: [], reviewedIds: [] };

  const existing = await prisma.review.findMany({
    where: {
      userId,
      productId: { in: reviewItems.map((item) => item.productId) },
    },
    select: { productId: true },
  });

  return {
    items: reviewItems,
    reviewedIds: existing.map((review) => review.productId),
  };
}
