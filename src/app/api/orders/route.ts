import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { phoneSchema, pincodeSchema } from "@/lib/validation/address";
import { ATTRIBUTION_LIMITS } from "@/constants/attribution";
import { auth } from "@/lib/auth/auth";
import { mapOrder, mapOrders } from "@/lib/db/orders";
import { prisma } from "@/lib/db/prisma";
import { normalizeAttribution } from "@/lib/attribution/parse";
import { validateAndCalculateCouponDiscount } from "@/lib/orders/coupons";
import { resolveOrderItemsFromCatalog } from "@/lib/orders/inventory";
import { calculatePricing, pricingFlagsFromLines } from "@/lib/orders/pricing";
import { saveCheckoutAddressForUser } from "@/lib/user/save-checkout-address";

const orderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string(),
        variantId: z.string(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
  shippingAddress: z.object({
    fullName: z.string().min(2),
    phone: phoneSchema(),
    email: z.string().email().optional().or(z.literal("")),
    line1: z.string().min(3),
    line2: z.string().optional(),
    city: z.string().min(2),
    state: z.string().min(2),
    pincode: pincodeSchema(),
    country: z.string().default("India"),
  }),
  couponCode: z.string().optional(),
  attribution: z
    .object({
      source: z.string().max(ATTRIBUTION_LIMITS.maxLength).optional(),
      medium: z.string().max(ATTRIBUTION_LIMITS.maxLength).optional(),
      campaign: z.string().max(ATTRIBUTION_LIMITS.maxLength).optional(),
      content: z.string().max(ATTRIBUTION_LIMITS.maxLength).optional(),
      term: z.string().max(ATTRIBUTION_LIMITS.maxLength).optional(),
      landingPath: z.string().max(ATTRIBUTION_LIMITS.pathMaxLength).optional(),
    })
    .optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = orderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolved = await resolveOrderItemsFromCatalog(parsed.data.items);
    if ("error" in resolved) {
      return NextResponse.json({ error: resolved.error }, { status: 400 });
    }

    const subtotal = resolved.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const coupon = await validateAndCalculateCouponDiscount({
      code: parsed.data.couponCode,
      items: resolved.items.map((line) => ({
        productId: String(line.productId),
        variantId: String(line.variantId),
        price: line.price,
        quantity: line.quantity,
      })),
      subtotal,
    });
    if (coupon.error) {
      return NextResponse.json({ error: coupon.error }, { status: 400 });
    }
    const flags = pricingFlagsFromLines(resolved.items);
    const pricing = calculatePricing(subtotal, coupon.discount, flags);

    const shippingAddress = {
      ...parsed.data.shippingAddress,
      email: parsed.data.shippingAddress.email || undefined,
      country: parsed.data.shippingAddress.country || "India",
    };

    const attribution = normalizeAttribution(parsed.data.attribution);
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        items: {
          create: resolved.items.map((line) => {
            const { sku, gstExempt, ...item } = line;
            void sku;
            void gstExempt;
            return item;
          }),
        },
        shippingAddress: shippingAddress as unknown as Prisma.InputJsonValue,
        pricing: pricing as unknown as Prisma.InputJsonValue,
        couponCode: coupon.code,
        attribution:
          attribution === undefined
            ? undefined
            : (attribution as unknown as Prisma.InputJsonValue),
        status: "PENDING",
        paymentStatus: "PENDING",
        stockDecremented: false,
      },
      include: { items: true, user: true },
    });

    // Coupon usage is counted only when the payment succeeds (markOrderPaid),
    // so abandoned checkouts don't use up limited coupons.

    await saveCheckoutAddressForUser(session.user.id, shippingAddress).catch(
      () => undefined,
    );

    return NextResponse.json({ data: mapOrder(order) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Order failed" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const orders = await prisma.order.findMany({
      where: { userId: session.user.id },
      include: { items: true, user: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ data: mapOrders(orders) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 },
    );
  }
}
