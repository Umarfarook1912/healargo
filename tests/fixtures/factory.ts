/**
 * Fixture factories. They write straight to the database through Prisma and
 * always include the run marker in a unique field (slug, email, code, name).
 */
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { RUN_ID, testCouponCode, testEmail, uid } from "./run";

export const TEST_PASSWORD = "secret123";
let passwordHash: string | null = null;
async function hash() {
  passwordHash ??= await bcrypt.hash(TEST_PASSWORD, 4);
  return passwordHash;
}

export async function createUser(
  opts: { role?: "user" | "admin"; name?: string; email?: string; password?: string | null; phone?: string } = {},
) {
  return prisma.user.create({
    data: {
      name: opts.name ?? `Test ${opts.role ?? "user"}`,
      email: (opts.email ?? testEmail(opts.role ?? "user")).toLowerCase(),
      passwordHash:
        opts.password === null ? null : opts.password ? await bcrypt.hash(opts.password, 4) : await hash(),
      role: opts.role ?? "user",
      phone: opts.phone ?? "9876543210",
    },
  });
}

export async function createCategory(opts: { name?: string; isActive?: boolean; sortOrder?: number } = {}) {
  const slug = uid("cat");
  return prisma.category.create({
    data: {
      name: opts.name ?? `Category ${slug}`,
      slug,
      isActive: opts.isActive ?? true,
      sortOrder: opts.sortOrder ?? 900,
    },
  });
}

export type VariantInput = {
  label?: string;
  price?: number;
  originalPrice?: number;
  offerPrice?: number;
  stock?: number;
  available?: boolean;
  sku?: string;
};

export async function createProduct(
  opts: {
    categoryId?: string;
    name?: string;
    variants?: VariantInput[];
    isActive?: boolean;
    isBestSeller?: boolean;
    gstExempt?: boolean;
    offer?: { startsAt: Date; endsAt: Date } | null;
  } = {},
) {
  const categoryId = opts.categoryId ?? (await createCategory()).id;
  const slug = uid("prd");
  const variants = (opts.variants ?? [{}]).map((v, i) => ({
    _id: randomUUID(),
    label: v.label ?? `V${i + 1}`,
    sku: v.sku ?? `${slug}-${i}`,
    price: v.price ?? 350,
    originalPrice: v.originalPrice ?? 400,
    ...(v.offerPrice !== undefined ? { offerPrice: v.offerPrice } : {}),
    stock: v.stock ?? 10,
    ...(v.available !== undefined ? { available: v.available } : {}),
  }));
  const product = await prisma.product.create({
    data: {
      name: opts.name ?? `Product ${slug}`,
      slug,
      description: "<p>Test product</p>",
      images: ["https://example.test/p.jpg"],
      categoryId,
      variants: variants as unknown as Prisma.InputJsonValue,
      isActive: opts.isActive ?? true,
      isBestSeller: opts.isBestSeller ?? false,
      gstExempt: opts.gstExempt ?? false,
      offerEnabled: Boolean(opts.offer),
      offerStartsAt: opts.offer?.startsAt ?? null,
      offerEndsAt: opts.offer?.endsAt ?? null,
    },
  });
  return { ...product, variantIds: variants.map((v) => v._id), categoryId };
}

export async function createCombo(opts: {
  items: Array<
    | { productId: string; variantId: string; quantity?: number; productName?: string; variantLabel?: string }
    | { isCustom: true; productName: string; customPrice: number; quantity?: number }
  >;
  price?: number;
  originalPrice?: number;
  isActive?: boolean;
  startsAt?: Date | null;
  endsAt?: Date | null;
  name?: string;
}) {
  const slug = uid("combo");
  return prisma.combo.create({
    data: {
      name: opts.name ?? `Combo ${slug}`,
      slug,
      price: opts.price ?? 600,
      originalPrice: opts.originalPrice ?? 800,
      isActive: opts.isActive ?? true,
      startsAt: opts.startsAt ?? null,
      endsAt: opts.endsAt ?? null,
      items: opts.items.map((item) => ({ quantity: 1, ...item })) as unknown as Prisma.InputJsonValue,
    },
  });
}

export async function createCoupon(
  opts: Partial<{
    code: string;
    discountType: "PERCENTAGE" | "FIXED";
    discountValue: number;
    validFrom: Date;
    validTo: Date;
    usageLimit: number;
    timesUsed: number;
    applicableProducts: string[];
    applicableVariants: string[];
    status: "ACTIVE" | "INACTIVE";
  }> = {},
) {
  const day = 24 * 60 * 60 * 1000;
  return prisma.coupon.create({
    data: {
      code: opts.code ?? testCouponCode(),
      name: `Coupon ${RUN_ID}`,
      discountType: opts.discountType ?? "PERCENTAGE",
      discountValue: opts.discountValue ?? 10,
      validFrom: opts.validFrom ?? new Date(Date.now() - day),
      validTo: opts.validTo ?? new Date(Date.now() + 30 * day),
      usageLimit: opts.usageLimit ?? 0,
      timesUsed: opts.timesUsed ?? 0,
      applicableProducts: opts.applicableProducts ?? [],
      applicableVariants: opts.applicableVariants ?? [],
      status: opts.status ?? "ACTIVE",
    },
  });
}

export function shippingAddress(overrides: Record<string, unknown> = {}) {
  return {
    fullName: `Test Buyer ${RUN_ID}`,
    phone: "9876543210",
    email: testEmail("ship"),
    line1: "1 Test Street",
    city: "Chennai",
    state: "Tamil Nadu",
    pincode: "600001",
    country: "India",
    ...overrides,
  };
}

/** Inserts an order directly (bypassing the API) for tests that need a given state. */
export async function createOrder(opts: {
  userId?: string | null;
  items: Array<{ productId: string; variantId: string; quantity: number; price?: number; name?: string }>;
  paymentStatus?: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  status?: "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  cashfreeOrderId?: string | null;
  stockDecremented?: boolean;
  couponCode?: string | null;
  trackingNumber?: string | null;
  trackingLastCheckedAt?: Date | null;
  shippedAt?: Date | null;
  total?: number;
}) {
  const subtotal = opts.items.reduce((s, i) => s + (i.price ?? 350) * i.quantity, 0);
  const total = opts.total ?? subtotal;
  return prisma.order.create({
    data: {
      userId: opts.userId ?? null,
      shippingAddress: shippingAddress() as unknown as Prisma.InputJsonValue,
      pricing: { subtotal, shipping: 0, tax: 0, discount: subtotal - total, total } as unknown as Prisma.InputJsonValue,
      status: opts.status ?? "PENDING",
      paymentStatus: opts.paymentStatus ?? "PENDING",
      cashfreeOrderId: opts.cashfreeOrderId ?? null,
      stockDecremented: opts.stockDecremented ?? false,
      couponCode: opts.couponCode ?? null,
      trackingNumber: opts.trackingNumber ?? null,
      trackingLastCheckedAt: opts.trackingLastCheckedAt ?? null,
      shippedAt: opts.shippedAt ?? null,
      items: {
        create: opts.items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          name: i.name ?? "Test item",
          variantLabel: "V1",
          price: i.price ?? 350,
          quantity: i.quantity,
        })),
      },
    },
    include: { items: true },
  });
}

export async function variantStock(productId: string, variantId: string): Promise<number> {
  const product = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
  const variants = product.variants as Array<{ _id: string; stock?: number }>;
  return variants.find((v) => v._id === variantId)?.stock ?? NaN;
}

export async function setVariantStock(productId: string, variantId: string, stock: number) {
  const product = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
  const variants = (product.variants as Array<{ _id: string; stock?: number }>).map((v) =>
    v._id === variantId ? { ...v, stock } : v,
  );
  await prisma.product.update({
    where: { id: productId },
    data: { variants: variants as unknown as Prisma.InputJsonValue },
  });
}
