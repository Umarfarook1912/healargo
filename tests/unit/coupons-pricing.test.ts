import { describe, expect, it } from "vitest";
import { evaluateCoupon, normalizeCouponCode, type CouponRecord } from "@/lib/orders/coupons";
import { calculatePricing, pricingFlagsFromLines } from "@/lib/orders/pricing";
import * as couponConstants from "@/constants/coupons";

const now = new Date("2026-11-15T12:00:00Z");
const coupon = (o: Partial<CouponRecord> = {}): CouponRecord => ({
  id: "c1",
  code: "PCT10",
  name: "Ten",
  discountType: "PERCENTAGE",
  discountValue: 10,
  validFrom: new Date(now.getTime() - 1e6),
  validTo: new Date(now.getTime() + 1e6),
  usageLimit: 0,
  timesUsed: 0,
  applicableProducts: [],
  applicableVariants: [],
  status: "ACTIVE",
  ...o,
}) as CouponRecord;
const items = [
  { productId: "p1", variantId: "v1", price: 350, quantity: 2 },
  { productId: "p2", variantId: "v2", price: 300, quantity: 1 },
];

describe("coupons", () => {
  it("CPN-001 normalizeCouponCode", () => {
    expect(normalizeCouponCode(" pct10 ")).toBe("PCT10");
    expect(normalizeCouponCode("")).toBeUndefined();
    expect(normalizeCouponCode(undefined)).toBeUndefined();
  });

  it("CPN-021 there are no hard-coded coupons", () => {
    expect(Object.keys(couponConstants)).toEqual(["COUPON_ERRORS"]);
    expect(JSON.stringify(couponConstants)).not.toMatch(/PURE10/);
  });

  it("evaluateCoupon: percentage, fixed, caps", () => {
    expect(evaluateCoupon(coupon(), { items, subtotal: 1000, now }).discount).toBe(100);
    expect(evaluateCoupon(coupon({ discountType: "FIXED", discountValue: 100 }), { items, subtotal: 1000, now }).discount).toBe(100);
    expect(evaluateCoupon(coupon({ discountType: "FIXED", discountValue: 5000 }), { items, subtotal: 1000, now }).discount).toBe(1000);
    expect(evaluateCoupon(coupon({ discountValue: 150 }), { items, subtotal: 1000, now }).discount).toBe(1000);
  });

  it("evaluateCoupon: status, dates and limit", () => {
    const err = (o: Partial<CouponRecord>) => evaluateCoupon(coupon(o), { items, subtotal: 1000, now }).error;
    expect(err({ status: "INACTIVE" })).toBe(couponConstants.COUPON_ERRORS.INACTIVE);
    expect(err({ validFrom: new Date(now.getTime() + 1000) })).toBe(couponConstants.COUPON_ERRORS.NOT_STARTED);
    expect(err({ validTo: new Date(now.getTime() - 1000) })).toBe(couponConstants.COUPON_ERRORS.EXPIRED);
    expect(err({ usageLimit: 2, timesUsed: 2 })).toBe(couponConstants.COUPON_ERRORS.LIMIT_REACHED);
    expect(err({ usageLimit: 2, timesUsed: 1 })).toBeUndefined();
  });

  it("evaluateCoupon: product and variant restrictions", () => {
    expect(evaluateCoupon(coupon({ applicableProducts: ["p1"] }), { items, subtotal: 1000, now }).discount).toBe(70);
    expect(evaluateCoupon(coupon({ applicableVariants: ["v2"] }), { items, subtotal: 1000, now }).discount).toBe(30);
    expect(evaluateCoupon(coupon({ applicableProducts: ["p9"] }), { items, subtotal: 1000, now }).error).toBe(couponConstants.COUPON_ERRORS.NOT_APPLICABLE);
    expect(evaluateCoupon(coupon({ applicableProducts: ["p1"] }), { items: [], subtotal: 1000, now }).error).toBe(couponConstants.COUPON_ERRORS.ITEMS_REQUIRED);
  });
});

describe("pricing", () => {
  it("CHK-012 calculatePricing", () => {
    expect(calculatePricing(100, 0)).toEqual({ subtotal: 100, shipping: 0, tax: 0, discount: 0, total: 100 });
    expect(calculatePricing(100, 150).total).toBe(0);
    expect(pricingFlagsFromLines([{ price: 1, quantity: 1 }])).toEqual({ taxableSubtotal: 0, waiveShipping: true });
  });
});
