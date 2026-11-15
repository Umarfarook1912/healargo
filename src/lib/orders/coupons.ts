import { COUPON_ERRORS } from "@/constants/coupons";
import { prisma } from "@/lib/db/prisma";

export function normalizeCouponCode(code: string | undefined): string | undefined {
  const trimmed = code?.trim().toUpperCase();
  return trimmed || undefined;
}

export type CouponLineItem = {
  productId: string;
  variantId?: string;
  price: number;
  quantity: number;
};

export type ValidatedCouponResult = {
  discount: number;
  code?: string;
  name?: string;
  discountType?: "PERCENTAGE" | "FIXED";
  discountValue?: number;
  error?: string;
  couponDoc?: { _id: string } | null;
};

export type CouponRecord = {
  id: string;
  code: string;
  name: string;
  status: "ACTIVE" | "INACTIVE" | string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  validFrom: Date | string;
  validTo: Date | string;
  usageLimit: number;
  timesUsed: number;
  applicableProducts?: string[] | null;
  applicableVariants?: string[] | null;
};

/**
 * Pure coupon rules (no DB): status, date window, usage limit, product and
 * variant eligibility, and the discount amount. Percentages are capped at 100
 * and the discount never exceeds the eligible subtotal.
 */
export function evaluateCoupon(
  coupon: CouponRecord,
  { items, subtotal, now = new Date() }: { items?: CouponLineItem[]; subtotal: number; now?: Date },
): ValidatedCouponResult {
  if (coupon.status !== "ACTIVE") {
    return { discount: 0, error: COUPON_ERRORS.INACTIVE };
  }
  if (new Date(coupon.validFrom) > now) {
    return { discount: 0, error: COUPON_ERRORS.NOT_STARTED };
  }
  if (new Date(coupon.validTo) < now) {
    return { discount: 0, error: COUPON_ERRORS.EXPIRED };
  }
  // timesUsed only counts paid orders (incremented in markOrderPaid).
  if (coupon.usageLimit > 0 && coupon.timesUsed >= coupon.usageLimit) {
    return { discount: 0, error: COUPON_ERRORS.LIMIT_REACHED };
  }

  let eligibleSubtotal = subtotal;
  const applicableProducts = coupon.applicableProducts?.map((id) => String(id)) ?? [];
  const applicableVariants = coupon.applicableVariants?.map((id) => String(id)) ?? [];
  const hasProductRestrictions = applicableProducts.length > 0;
  const hasVariantRestrictions = applicableVariants.length > 0;

  if (hasProductRestrictions || hasVariantRestrictions) {
    if (!items || items.length === 0) {
      return { discount: 0, error: COUPON_ERRORS.ITEMS_REQUIRED };
    }

    const eligibleItems = items.filter((item) => {
      const pId = String(item.productId);
      const vId = item.variantId ? String(item.variantId) : "";
      // If specific variants are configured on this coupon:
      if (hasVariantRestrictions && vId && applicableVariants.includes(vId)) {
        return true;
      }
      // If product is in applicableProducts and no specific variant restrictions exist:
      return (
        hasProductRestrictions &&
        !hasVariantRestrictions &&
        applicableProducts.includes(pId)
      );
    });

    if (eligibleItems.length === 0) {
      return { discount: 0, error: COUPON_ERRORS.NOT_APPLICABLE };
    }
    eligibleSubtotal = eligibleItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
  }

  const value = Math.max(0, coupon.discountValue);
  const raw =
    coupon.discountType === "PERCENTAGE"
      ? Math.round(eligibleSubtotal * (Math.min(value, 100) / 100))
      : value;
  const discount = Math.max(0, Math.min(raw, eligibleSubtotal));

  return {
    discount,
    code: coupon.code,
    name: coupon.name,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    couponDoc: { _id: coupon.id },
  };
}

/**
 * Validates a coupon against the database (there are no hard-coded coupons),
 * checks date validity, usage limits, and product eligibility, and computes discount.
 */
export async function validateAndCalculateCouponDiscount({
  code,
  items,
  subtotal,
}: {
  code: string | undefined;
  items?: CouponLineItem[];
  subtotal: number;
}): Promise<ValidatedCouponResult> {
  const normalized = normalizeCouponCode(code);
  if (!normalized) {
    return { discount: 0 };
  }

  const dbCoupon = await prisma.coupon.findUnique({ where: { code: normalized } });
  if (!dbCoupon) {
    return { discount: 0, error: COUPON_ERRORS.INVALID };
  }

  return evaluateCoupon(dbCoupon, { items, subtotal });
}
