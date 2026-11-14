import { AdminReviewsClient } from "@/components/features/admin/AdminReviewsClient";
import { mapReviews } from "@/lib/db/orders";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const reviews = mapReviews(
    await prisma.review.findMany({ orderBy: { createdAt: "desc" } }),
  );

  return <AdminReviewsClient reviews={reviews} />;
}
