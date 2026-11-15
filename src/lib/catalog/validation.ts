import { z } from "zod";
import { stripHtml } from "@/lib/utils/format";

/** Joins zod issues into one readable message (the admin forms toast `json.error`). */
export function zodErrorMessage(error: z.ZodError, fallback = "Invalid data"): string {
  const message = error.issues
    .map((i) => (i.path.length ? `${i.path.join(".")}: ${i.message}` : i.message))
    .join(", ");
  return message || fallback;
}

const dateString = z
  .string()
  .refine((value) => !value || !Number.isNaN(new Date(value).getTime()), "Invalid date");

export function parseOptionalDate(value?: string | null): Date | null {
  if (!value || !value.trim()) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/* ---------------------------------- Products --------------------------------- */

export const productVariantSchema = z.object({
  _id: z.string().optional(),
  label: z.string().min(1),
  sku: z.string(),
  originalPrice: z.number().nonnegative(),
  price: z.number().positive("Price must be greater than 0"),
  offerPrice: z.number().nonnegative().optional(),
  available: z.boolean().optional(),
  stock: z.number().int().nonnegative(),
  image: z.string().optional(),
  weightGrams: z.number().nonnegative().optional(),
});

const productSeoSchema = z
  .object({
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    metaKeywords: z.array(z.string()).optional(),
    ogImage: z.string().optional(),
    canonicalUrl: z.string().optional(),
  })
  .optional();

const productFields = {
  name: z.string().min(2),
  slug: z.string().optional(),
  description: z.string().refine((value) => stripHtml(value).length >= 2),
  shortDescription: z.string().optional().nullable(),
  images: z.array(z.string()).default([]),
  videos: z.array(z.string()).default([]),
  categoryId: z.string().min(1),
  variants: z.array(productVariantSchema).min(1),
  tags: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  isBestSeller: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  gstExempt: z.boolean().default(false),
  offerEnabled: z.boolean().default(false),
  offerStartsAt: dateString.optional().nullable(),
  offerEndsAt: dateString.optional().nullable(),
  seo: productSeoSchema,
};

export const productSchema = z.object(productFields);

/**
 * PUT accepts any subset of the create fields. Unknown keys (for example
 * `averageRating`, `reviewCount`, `id`) are stripped, never written.
 */
export const productUpdateSchema = productSchema.partial();

export type ProductInput = z.infer<typeof productSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;

/* --------------------------------- Categories -------------------------------- */

export const categorySchema = z.object({
  name: z.string().min(2),
  slug: z.string().optional(),
  description: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  badge: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const categoryUpdateSchema = categorySchema.partial();

/* ----------------------------------- Combos ---------------------------------- */

export const comboItemSchema = z.object({
  productId: z.string().optional(),
  variantId: z.string().optional(),
  quantity: z.coerce.number().int().positive().default(1),
  productName: z.string().optional(),
  variantLabel: z.string().optional(),
  isCustom: z.boolean().optional(),
  customPrice: z.coerce.number().nonnegative().optional(),
  customImage: z.string().optional(),
});

const comboItemsSchema = z
  .array(comboItemSchema)
  .min(1, "At least one item is required in the combo")
  .refine(
    (items) =>
      items.every((item) =>
        item.isCustom
          ? Boolean(item.productName && stripHtml(item.productName).length >= 2)
          : Boolean(
              (item.productId && item.variantId) ||
                (item.productName && stripHtml(item.productName).length >= 2),
            ),
      ),
    { message: "Each item must have a selected variant or a custom product name" },
  );

const comboFields = {
  name: z
    .string()
    .refine((value) => stripHtml(value).length >= 2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  images: z.array(z.string()).default([]),
  videos: z.array(z.string()).default([]),
  price: z.coerce.number().positive("Combo price must be greater than 0"),
  originalPrice: z.coerce.number().nonnegative("Original price must be 0 or more"),
  isActive: z.boolean().default(true),
  startsAt: z.string().optional().nullable(),
  endsAt: z.string().optional().nullable(),
  items: comboItemsSchema,
};

export const comboSchema = z.object(comboFields);
export const comboUpdateSchema = comboSchema.partial();

/* ----------------------------------- Slugs ----------------------------------- */

/**
 * Returns `base`, or `base-2`, `base-3`… when the slug is already taken, so a
 * duplicate name no longer fails with a unique-constraint 500.
 */
export async function uniqueSlug(
  base: string,
  isTaken: (slug: string) => Promise<boolean>,
): Promise<string> {
  const root = base || `item-${Date.now()}`;
  if (!(await isTaken(root))) return root;
  for (let n = 2; n < 100; n += 1) {
    const candidate = `${root}-${n}`;
    if (!(await isTaken(candidate))) return candidate;
  }
  return `${root}-${Date.now()}`;
}
