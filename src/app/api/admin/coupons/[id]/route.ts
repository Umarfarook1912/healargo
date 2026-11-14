import { requireAdmin } from "@/lib/auth/require-admin";
import { NextResponse } from "next/server";
import { z } from "zod";
import { mapCoupon } from "@/lib/db/orders";
import { prisma } from "@/lib/db/prisma";

const updateSchema = z.object({
  code: z
    .string()
    .min(2, "Code must be at least 2 characters")
    .transform((val) => val.trim().toUpperCase())
    .optional(),
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  description: z.string().optional(),
  discountType: z.enum(["PERCENTAGE", "FIXED"]).optional(),
  discountValue: z.number().min(0, "Discount value must be 0 or higher").optional(),
  validFrom: z.string().min(1, "Valid from date is required").optional(),
  validTo: z.string().min(1, "Valid to date is required").optional(),
  usageLimit: z.number().int().min(0).optional(),
  applicableProducts: z.array(z.string()).optional(),
  applicableVariants: z.array(z.string()).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid update data" },
        { status: 400 },
      );
    }

    if (parsed.data.code) {
      const duplicate = await prisma.coupon.findFirst({
        where: {
          code: parsed.data.code,
          id: { not: id },
        },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "Another coupon with this code already exists" },
          { status: 400 },
        );
      }
    }

    const updates: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.validFrom) {
      updates.validFrom = new Date(parsed.data.validFrom);
    }
    if (parsed.data.validTo) {
      updates.validTo = new Date(parsed.data.validTo);
    }

    const existing = await prisma.coupon.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }
    const updated = await prisma.coupon.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json({ data: mapCoupon(updated) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update coupon" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  try {
    const { id } = await params;
    const deleted = await prisma.coupon.deleteMany({ where: { id } });
    if (deleted.count === 0) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "Coupon deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete coupon" },
      { status: 500 },
    );
  }
}
