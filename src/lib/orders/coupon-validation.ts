import { z } from "zod";

const dateString = (label: string) =>
  z
    .string()
    .min(1, `${label} date is required`)
    .refine((value) => !Number.isNaN(new Date(value).getTime()), `${label} date is invalid`);

const codeSchema = z
  .string()
  .min(2, "Code must be at least 2 characters")
  .transform((val) => val.trim().toUpperCase());

export const couponCreateSchema = z.object({
  code: codeSchema,
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional().default(""),
  discountType: z.enum(["PERCENTAGE", "FIXED"]).default("PERCENTAGE"),
  discountValue: z.number().min(0, "Discount value must be 0 or higher"),
  validFrom: dateString("Valid from"),
  validTo: dateString("Valid to"),
  usageLimit: z.number().int().min(0).default(0),
  applicableProducts: z.array(z.string()).default([]),
  applicableVariants: z.array(z.string()).default([]),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export const couponUpdateSchema = z.object({
  code: codeSchema.optional(),
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  description: z.string().optional(),
  discountType: z.enum(["PERCENTAGE", "FIXED"]).optional(),
  discountValue: z.number().min(0, "Discount value must be 0 or higher").optional(),
  validFrom: dateString("Valid from").optional(),
  validTo: dateString("Valid to").optional(),
  usageLimit: z.number().int().min(0).optional(),
  applicableProducts: z.array(z.string()).optional(),
  applicableVariants: z.array(z.string()).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

/**
 * Cross-field rules, checked on the final (merged) values:
 * a percentage can't exceed 100 and the window must end after it starts.
 */
export function couponRuleError(coupon: {
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  validFrom: Date | string;
  validTo: Date | string;
}): string | null {
  if (coupon.discountType === "PERCENTAGE" && coupon.discountValue > 100) {
    return "Percentage discount cannot be more than 100";
  }
  if (new Date(coupon.validTo).getTime() <= new Date(coupon.validFrom).getTime()) {
    return "Valid to date must be after valid from date";
  }
  return null;
}
