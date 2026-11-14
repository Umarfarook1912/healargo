import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { AUTH_ERRORS } from "@/constants/auth";
import { DEFAULT_SHIPPING_COUNTRY } from "@/constants/checkout";
import { requireAdmin } from "@/lib/auth/require-admin";
import { mapOrder } from "@/lib/db/orders";
import { prisma } from "@/lib/db/prisma";
import { isDbId } from "@/lib/db/serialize";
import {
  calculatePricing,
  pricingFlagsFromLines,
} from "@/lib/orders/pricing";
import { resolveOrderItemsFromCatalog } from "@/lib/orders/inventory";
import { OrderStatus, PaymentStatus } from "@/types/order";

const statusEnum = z.nativeEnum(OrderStatus);
const paymentEnum = z.nativeEnum(PaymentStatus);

const patchSchema = z.object({
  id: z.string(),
  status: statusEnum.optional(),
  paymentStatus: paymentEnum.optional(),
  notes: z.string().optional(),
  trackingNumber: z.string().optional(),
  courier: z.string().optional(),
});

const createSchema = z.object({
  shippingAddress: z.object({
    fullName: z.string().min(2),
    phone: z.string().min(10),
    email: z.string().email().optional().or(z.literal("")),
    line1: z.string().min(3),
    line2: z.string().optional(),
    city: z.string().min(2),
    state: z.string().min(2),
    pincode: z.string().min(6),
    country: z.string().default(DEFAULT_SHIPPING_COUNTRY),
  }),
  items: z
    .array(
      z.object({
        productId: z.string(),
        variantId: z.string(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
  status: statusEnum.optional(),
  paymentStatus: paymentEnum.optional(),
  notes: z.string().optional(),
});

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  try {
    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: AUTH_ERRORS.invalidInput },
        { status: 400 },
      );
    }

    const resolved = await resolveOrderItemsFromCatalog(parsed.data.items);
    if ("error" in resolved) {
      return NextResponse.json(
        { error: AUTH_ERRORS.invalidInput },
        { status: 400 },
      );
    }

    const subtotal = resolved.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const flags = pricingFlagsFromLines(resolved.items);
    const order = await prisma.order.create({
      data: {
        items: {
          create: resolved.items.map((line) => {
            const { gstExempt: _gstExempt, ...item } = line;
            void _gstExempt;
            return {
              productId: String(item.productId),
              variantId: String(item.variantId),
              name: item.name,
              variantLabel: item.variantLabel,
              image: item.image,
              price: item.price,
              quantity: item.quantity,
            };
          }),
        },
        shippingAddress: {
          ...parsed.data.shippingAddress,
          email: parsed.data.shippingAddress.email || undefined,
        } as unknown as Prisma.InputJsonValue,
        pricing: calculatePricing(subtotal, 0, flags) as unknown as Prisma.InputJsonValue,
        status: parsed.data.status ?? OrderStatus.PENDING,
        paymentStatus: parsed.data.paymentStatus ?? PaymentStatus.PENDING,
        notes: parsed.data.notes,
      },
      include: { items: true, user: true },
    });

    return NextResponse.json({ data: mapOrder(order) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : AUTH_ERRORS.createFailed },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  try {
    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: AUTH_ERRORS.invalidInput },
        { status: 400 },
      );
    }
    const { id, ...updates } = parsed.data;
    if (!isDbId(id)) {
      return NextResponse.json(
        { error: AUTH_ERRORS.notFound },
        { status: 404 },
      );
    }

    if (updates.paymentStatus === PaymentStatus.PAID) {
      const { markOrderPaid } = await import("@/lib/orders/mark-paid");
      await markOrderPaid({ orderId: id });
      const { paymentStatus, ...rest } = updates;
      void paymentStatus;
      if (Object.keys(rest).length) {
        await prisma.order.update({ where: { id }, data: rest });
      }
      const order = await prisma.order.findUnique({
        where: { id },
        include: { items: true, user: true },
      });
      return NextResponse.json({ data: order ? mapOrder(order) : null });
    }

    const previous = await prisma.order.findUnique({
      where: { id },
      include: { items: true, user: true },
    });
    if (!previous) {
      return NextResponse.json(
        { error: AUTH_ERRORS.notFound },
        { status: 404 },
      );
    }

    const order = await prisma.order.update({
      where: { id },
      data: updates,
      include: { items: true, user: true },
    });

    if (updates.status && previous.status !== updates.status) {
      const { sendOrderStatusEmail } = await import("@/lib/email/send");
      void sendOrderStatusEmail(mapOrder(order), updates.status).catch(
        () => undefined,
      );
    }

    return NextResponse.json({ data: mapOrder(order) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : AUTH_ERRORS.updateFailed },
      { status: 500 },
    );
  }
}
