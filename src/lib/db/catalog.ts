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

export function normalizeProductSeo(seo: unknown): ProductSeo {
  return (seo as ProductSeo | null) ?? {};
}

export function mapCategory(row: PrismaCategory): Category {
  return withId({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? undefined,
    image: row.image ?? undefined,
    badge: row.badge ?? undefined,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
  });
}

export function mapCategories(rows: PrismaCategory[]): Category[] {
  return rows.map(mapCategory);
}

export function mapProduct(row: ProductWithCategory): Product {
  return withId({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    shortDescription: row.shortDescription ?? undefined,
    images: row.images,
    videos: row.videos,
    categoryId: row.category ? mapCategory(row.category) : row.categoryId,
    variants: normalizeProductVariants(row.variants),
    tags: row.tags,
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
  return rows.map(mapProduct);
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
