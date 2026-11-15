export const COUPON_ERRORS = {
  INVALID: "Invalid or expired coupon code",
  INACTIVE: "This coupon is currently inactive",
  NOT_STARTED: "This coupon is not active yet",
  EXPIRED: "This coupon has expired",
  LIMIT_REACHED: "This coupon has reached its maximum usage limit",
  ITEMS_REQUIRED: "Cart items required to validate coupon restrictions",
  NOT_APPLICABLE: "This coupon is not applicable to any products or variants in your cart",
} as const;
