import type {
  Coupon as PrismaCoupon,
  Order as PrismaOrder,
  OrderItem as PrismaOrderItem,
  Review as PrismaReview,
  User as PrismaUser,
} from "@prisma/client";
import { withId } from "@/lib/db/serialize";
import type { CampaignAttribution } from "@/types/attribution";
import type { Coupon } from "@/types/coupon";
import {
  OrderStatus as AppOrderStatus,
  PaymentStatus as AppPaymentStatus,
  type Order,
  type OrderItem,
  type OrderPricing,
} from "@/types/order";
import type { Review } from "@/types/review";
import type { ShippingAddress } from "@/types/user";

type OrderWithRelations = PrismaOrder & {
  items: PrismaOrderItem[];
  user?: PrismaUser | null;
};

export function mapCoupon(row: PrismaCoupon): Coupon {
  return withId({
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description || undefined,
    discountType: row.discountType,
    discountValue: row.discountValue,
    validFrom: row.validFrom.toISOString(),
    validTo: row.validTo.toISOString(),
    usageLimit: row.usageLimit,
    timesUsed: row.timesUsed,
    applicableProducts: row.applicableProducts,
    applicableVariants: row.applicableVariants,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
}

export function mapCoupons(rows: PrismaCoupon[]): Coupon[] {
  return rows.map(mapCoupon);
}

export function mapReview(row: PrismaReview): Review {
  return withId({
    id: row.id,
    productId: row.productId,
    userId: row.userId ?? undefined,
    authorName: row.authorName,
    rating: row.rating,
    body: row.body,
    isVerified: row.isVerified,
    isApproved: row.isApproved,
    createdAt: row.createdAt.toISOString(),
  });
}

export function mapReviews(rows: PrismaReview[]): Review[] {
  return rows.map(mapReview);
}

export function mapOrder(row: OrderWithRelations): Order {
  return withId({
    id: row.id,
    userId: row.user
      ? withId({
          id: row.user.id,
          name: row.user.name,
          email: row.user.email,
          phone: row.user.phone ?? undefined,
        })
      : row.userId ?? undefined,
    items: row.items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      name: item.name,
      variantLabel: item.variantLabel,
      image: item.image ?? "",
      price: item.price,
      quantity: item.quantity,
    })) as OrderItem[],
    shippingAddress: row.shippingAddress as unknown as ShippingAddress,
    pricing: row.pricing as unknown as OrderPricing,
    status: row.status as AppOrderStatus,
    paymentStatus: row.paymentStatus as AppPaymentStatus,
    cashfreeOrderId: row.cashfreeOrderId ?? undefined,
    cashfreePaymentId: row.cashfreePaymentId ?? undefined,
    couponCode: row.couponCode ?? undefined,
    attribution: (row.attribution as unknown as CampaignAttribution | null) ?? undefined,
    notes: row.notes ?? undefined,
    stockDecremented: row.stockDecremented,
    trackingNumber: row.trackingNumber ?? undefined,
    courier: row.courier ?? undefined,
    trackingStatus: row.trackingStatus ?? undefined,
    trackingLastCheckedAt: row.trackingLastCheckedAt?.toISOString(),
    trackingUpdatedAt: row.trackingUpdatedAt?.toISOString(),
    shippedAt: row.shippedAt?.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
}

export function mapOrders(rows: OrderWithRelations[]): Order[] {
  return rows.map(mapOrder);
}
