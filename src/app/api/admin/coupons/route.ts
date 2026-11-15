import { requireAdmin } from "@/lib/auth/require-admin";
import { NextResponse } from "next/server";
import {
  couponCreateSchema,
  couponRuleError,
} from "@/lib/orders/coupon-validation";
import { mapCoupon, mapCoupons } from "@/lib/db/orders";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
    });

    const now = new Date();
    const total = coupons.length;
    const active = coupons.filter(
      (c) => c.status === "ACTIVE" && new Date(c.validTo) >= now,
    ).length;
    const expired = coupons.filter((c) => new Date(c.validTo) < now).length;
    const totalRedemptions = coupons.reduce(
      (sum, c) => sum + (c.timesUsed || 0),
      0,
    );

    return NextResponse.json({
      data: mapCoupons(coupons),
      stats: {
        total,
        active,
        expired,
        totalRedemptions,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch coupons" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  try {
    const body = await request.json();
    const parsed = couponCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid coupon data" },
        { status: 400 },
      );
    }

    const ruleError = couponRuleError(parsed.data);
    if (ruleError) {
      return NextResponse.json({ error: ruleError }, { status: 400 });
    }

    const existing = await prisma.coupon.findUnique({ where: { code: parsed.data.code } });
    if (existing) {
      return NextResponse.json(
        { error: "A coupon with this code already exists" },
        { status: 400 },
      );
    }

    const created = await prisma.coupon.create({
      data: {
        code: parsed.data.code,
        name: parsed.data.name,
        description: parsed.data.description,
        discountType: parsed.data.discountType,
        discountValue: parsed.data.discountValue,
        validFrom: new Date(parsed.data.validFrom),
        validTo: new Date(parsed.data.validTo),
        usageLimit: parsed.data.usageLimit,
        timesUsed: 0,
        applicableProducts: parsed.data.applicableProducts,
        applicableVariants: parsed.data.applicableVariants,
        status: parsed.data.status,
      },
    });
    return NextResponse.json({ data: mapCoupon(created) }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create coupon" },
      { status: 500 },
    );
  }
}
