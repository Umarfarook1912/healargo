import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { mapReview, mapReviews } from "@/lib/db/orders";
import { prisma } from "@/lib/db/prisma";
import { recalculateProductReviewStats } from "@/lib/reviews/stats";
import { PaymentStatus } from "@/types/order";

const schema = z.object({
  productId: z.string(),
  authorName: z.string().trim().min(2),
  rating: z.number().min(1).max(5),
  body: z.string().trim().min(2),
});

export async function GET(request: Request) {
  try {
    const productId = new URL(request.url).searchParams.get("productId");
    if (!productId) {
      return NextResponse.json({ error: "productId required" }, { status: 400 });
    }
    const reviews = await prisma.review.findMany({
      where: { productId, isApproved: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ data: mapReviews(reviews) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const session = await auth();

    let isVerified = false;
    if (session?.user?.id) {
      const purchased = await prisma.order.findFirst({
        where: {
          userId: session.user.id,
          paymentStatus: PaymentStatus.PAID,
          items: { some: { productId: parsed.data.productId } },
        },
        select: { id: true },
      });
      isVerified = Boolean(purchased);
    }

    const review = await prisma.review.create({
      data: {
        ...parsed.data,
        userId: session?.user?.id,
        isApproved: false,
        isVerified,
      },
    });

    await recalculateProductReviewStats(parsed.data.productId);

    return NextResponse.json({ data: mapReview(review) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 },
    );
  }
}
