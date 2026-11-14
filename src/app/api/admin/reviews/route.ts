import { NextResponse } from "next/server";
import { z } from "zod";
import { USER_ROLES } from "@/constants/auth";
import { auth } from "@/lib/auth/auth";
import { mapReview } from "@/lib/db/orders";
import { prisma } from "@/lib/db/prisma";
import { recalculateProductReviewStats } from "@/lib/reviews/stats";

const schema = z.object({
  id: z.string(),
  isApproved: z.boolean(),
});

const deleteSchema = z.object({
  id: z.string(),
});

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== USER_ROLES.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const existing = await prisma.review.findUnique({ where: { id: parsed.data.id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const review = await prisma.review.update({
      where: { id: parsed.data.id },
      data: { isApproved: parsed.data.isApproved },
    });
    if (!review) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    await recalculateProductReviewStats(review.productId);
    return NextResponse.json({ data: mapReview(review) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== USER_ROLES.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const parsed = deleteSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const review = await prisma.review.findUnique({ where: { id: parsed.data.id } });
    if (review) {
      await prisma.review.delete({ where: { id: parsed.data.id } });
      await recalculateProductReviewStats(review.productId);
    }
    return NextResponse.json({ data: { ok: true } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 },
    );
  }
}
