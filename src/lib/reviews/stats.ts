import { prisma } from "@/lib/db/prisma";

export async function recalculateProductReviewStats(
  productId: string,
): Promise<void> {
  const stats = await prisma.review.aggregate({
    where: { productId, isApproved: true },
    _avg: { rating: true },
    _count: { _all: true },
  });

  const averageRating = stats._avg.rating
    ? Math.round(stats._avg.rating * 10) / 10
    : 0;
  const reviewCount = stats._count._all ?? 0;

  await prisma.product.update({
    where: { id: productId },
    data: { averageRating, reviewCount },
  });
}
