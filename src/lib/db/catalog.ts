import type {
  Carousel as PrismaCarousel,
  Category as PrismaCategory,
  Combo as PrismaCombo,
  Product as PrismaProduct,
} from "@prisma/client";
import { withId } from "@/lib/db/serialize";
import type { CarouselSlide } from "@/types/carousel";
import type { ComboItem, ComboOffer } from "@/types/combo";
import type { Category, Product, ProductSeo, ProductVariant } from "@/types/product";

type ProductWithCategory = PrismaProduct & {
  category?: PrismaCategory | null;
};

export function normalizeProductVariants(variants: unknown): ProductVariant[] {
  const list = Array.isArray(variants) ? (variants as ProductVariant[]) : [];
  return list.map((variant) => ({
    ...variant,
    _id: variant._id || crypto.randomUUID(),
  }));
}

export function cleanTextWoodPressTerms(text?: string | null): string {
  if (!text) return "";
  return text
    .replace(/wood(?:en)?[\s-]pressed[\s-]oils?/gi, "Cold Pressed Oils")
    .replace(/wood(?:en)?[\s-]press(?:ed)?/gi, "Cold Pressed")
    .replace(/mara(?:k)?\s*chekku/gi, "Cold Pressed")
    .replace(/vaagai\s*wood(?:en)?/gi, "Traditional")
    .replace(/marachekku/gi, "Cold Pressed");
}

export function isAllowedProduct(p: {
  name?: string | null;
  slug?: string | null;
  tags?: string[] | null;
}): boolean {
  const text = `${p.name ?? ""} ${p.slug ?? ""} ${(p.tags ?? []).join(" ")}`.toLowerCase();

  // Explicitly excluded products
  const excluded = [
    "mahua",
    "iluppai",
    "pulse",
    "sugar",
    "sakkarai",
    "hair",
    "clean",
    "cake",
  ];
  if (excluded.some((term) => text.includes(term))) {
    return false;
  }

  // Allowed products: Sesame, Coconut, Groundnut, Castor, Pongam, Neem, Ghee
  const allowed = [
    "sesame",
    "gingelly",
    "til",
    "nallenai",
    "நல்லெண்ணெய்",
    "coconut",
    "thengai",
    "தேங்காய்",
    "groundnut",
    "peanut",
    "kadalai",
    "கடலை",
    "castor",
    "amanakku",
    "ஆமணக்கு",
    "ponga",
    "pongam",
    "pungam",
    "புங்க",
    "neem",
    "veppam",
    "வேப்ப",
    "ghee",
    "ney",
    "uthukuli",
    "பசு நெய்",
  ];
  return allowed.some((term) => text.includes(term));
}

export function normalizeProductSeo(seo: unknown): ProductSeo {
  const s = (seo as ProductSeo | null) ?? {};
  return {
    ...s,
    metaTitle: s.metaTitle ? cleanTextWoodPressTerms(s.metaTitle) : undefined,
    metaDescription: s.metaDescription ? cleanTextWoodPressTerms(s.metaDescription) : undefined,
    metaKeywords: s.metaKeywords?.map(cleanTextWoodPressTerms),
  };
}

export function mapCategory(row: PrismaCategory): Category {
  const cleanName = cleanTextWoodPressTerms(row.name);
  const cleanDesc = cleanTextWoodPressTerms(row.description);
  return withId({
    id: row.id,
    name: cleanName,
    slug: row.slug,
    description: cleanDesc ?? undefined,
    image: row.image ?? undefined,
    badge: row.badge ?? undefined,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
  });
}

export function mapCategories(rows: PrismaCategory[]): Category[] {
  // Only include active categories relevant to the 4 product types
  return rows
    .filter((c) => {
      const slug = c.slug.toLowerCase();
      return (
        slug !== "home-cleaning" &&
        slug !== "oil-cakes" &&
        !slug.includes("cleaning")
      );
    })
    .map(mapCategory);
}

export function mapProduct(row: ProductWithCategory): Product {
  const cleanName = cleanTextWoodPressTerms(row.name);
  const cleanDesc = cleanTextWoodPressTerms(row.description);
  const cleanShortDesc = cleanTextWoodPressTerms(row.shortDescription);
  const cleanTags = (row.tags || []).map((t) => cleanTextWoodPressTerms(t));

  return withId({
    id: row.id,
    name: cleanName,
    slug: row.slug,
    description: cleanDesc,
    shortDescription: cleanShortDesc || undefined,
    images: row.images,
    videos: row.videos,
    categoryId: row.category ? mapCategory(row.category) : row.categoryId,
    variants: normalizeProductVariants(row.variants),
    tags: cleanTags,
    isActive: row.isActive,
    isBestSeller: row.isBestSeller,
    isNewArrival: row.isNewArrival,
    gstExempt: row.gstExempt,
    offerEnabled: row.offerEnabled,
    offerStartsAt: row.offerStartsAt?.toISOString() ?? null,
    offerEndsAt: row.offerEndsAt?.toISOString() ?? null,
    seo: normalizeProductSeo(row.seo),
    averageRating: row.averageRating,
    reviewCount: row.reviewCount,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
}

export function mapProducts(rows: ProductWithCategory[]): Product[] {
  return rows.filter((p) => isAllowedProduct(p)).map(mapProduct);
}

export function mapCombo(row: PrismaCombo): ComboOffer {
  return withId({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? undefined,
    images: row.images,
    videos: row.videos,
    price: row.price,
    originalPrice: row.originalPrice,
    isActive: row.isActive,
    startsAt: row.startsAt?.toISOString() ?? null,
    endsAt: row.endsAt?.toISOString() ?? null,
    items: (row.items as ComboItem[] | null) ?? [],
  });
}

export function mapCombos(rows: PrismaCombo[]): ComboOffer[] {
  return rows.map(mapCombo);
}

export function mapCarousel(row: PrismaCarousel): CarouselSlide {
  return withId({
    id: row.id,
    imageUrl: row.imageUrl,
    navigationLink: row.navigationLink,
    headline: row.headline || undefined,
    subheadline: row.subheadline || undefined,
    buttonText: row.buttonText || undefined,
    altText: row.altText || undefined,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
}

export function mapCarousels(rows: PrismaCarousel[]): CarouselSlide[] {
  return rows.map(mapCarousel);
}
