import { ASSETS } from "@/constants/assets";

export const DEFAULT_CATEGORY_IMAGES: Record<string, string> = {
  "wood-pressed-oils": "/assets/healargo/banners/hero-desktop.webp",
  "coconut-oil": "/assets/healargo/categories/coconut-category.webp",
  "sesame-oil": "/assets/healargo/categories/sesame-category.webp",
  "groundnut-oil": "/assets/healargo/categories/groundnut-category.webp",
  "pure-cow-ghee": "/assets/healargo/categories/sesame-category.webp",
  "traditional-oils": "/assets/healargo/categories/sesame-category.webp",
  "oil-cakes": "/assets/healargo/categories/groundnut-category.webp",
  "combo-offers": "/assets/healargo/banners/collection-banner.webp",
};

export function cleanImageUrl(url?: string | null): string {
  if (!url) return "";
  return url.trim().replace(/^['"]|['"]$/g, "");
}

/**
 * Returns a consistent, dedicated HEALARGO product photograph matching the oil type.
 * Replaces old brand promotional posters with modern commercial D2C photography.
 */
export function getHealargoProductAsset(product?: {
  name?: string;
  slug?: string;
  tags?: string[];
}): string | null {
  if (!product) return null;
  const text = `${product.name ?? ""} ${product.slug ?? ""} ${(product.tags ?? []).join(" ")}`.toLowerCase();

  if (text.includes("coconut") || text.includes("thengai")) {
    return ASSETS.PRODUCTS.COCONUT_OIL;
  }
  if (text.includes("sesame") || text.includes("gingelly") || text.includes("nallenai") || text.includes("til")) {
    return ASSETS.PRODUCTS.SESAME_OIL;
  }
  if (text.includes("groundnut") || text.includes("peanut") || text.includes("kadalai")) {
    return ASSETS.PRODUCTS.GROUNDNUT_OIL;
  }
  return null;
}

export function getProductImageUrl(
  product?: {
    name?: string;
    slug?: string;
    tags?: string[];
    images?: string[];
    categoryId?: string | { _id?: string; slug?: string; image?: string } | null;
  } | null,
  categoryFallback?: { slug?: string; image?: string } | null,
): string {
  if (!product) return ASSETS.PLACEHOLDER_PRODUCT;

  // 1. If product matches a core HEALARGO oil type, use the verified HEALARGO studio photograph
  const healargoAsset = getHealargoProductAsset(product);
  if (healargoAsset) {
    return healargoAsset;
  }

  // 2. Check if product has explicit images array with a valid non-placeholder, non-legacy image
  if (Array.isArray(product.images) && product.images.length > 0) {
    const validImage = product.images.find((img) => {
      const cleaned = cleanImageUrl(img);
      // Filter out legacy promotional posters that have old brand watermark
      const isLegacyPoster = cleaned.includes("vsoilmill") || cleaned.includes("zxpphru8x");
      return (
        cleaned.length > 0 &&
        !isLegacyPoster &&
        cleaned !== ASSETS.PLACEHOLDER_PRODUCT &&
        cleaned !== "/images/product-placeholder.svg"
      );
    });

    if (validImage) {
      return cleanImageUrl(validImage);
    }
  }

  // 3. Check if product.categoryId is an object with image or slug
  if (
    product.categoryId &&
    typeof product.categoryId === "object" &&
    product.categoryId !== null
  ) {
    const cat = product.categoryId as { slug?: string; image?: string };
    if (cat.slug && DEFAULT_CATEGORY_IMAGES[cat.slug]) {
      return DEFAULT_CATEGORY_IMAGES[cat.slug];
    }
    if (cat.image && cleanImageUrl(cat.image) && !cat.image.endsWith(".svg") && !cat.image.includes("vsoilmill")) {
      return cleanImageUrl(cat.image);
    }
  }

  // 4. Check explicit category fallback
  if (categoryFallback) {
    if (categoryFallback.slug && DEFAULT_CATEGORY_IMAGES[categoryFallback.slug]) {
      return DEFAULT_CATEGORY_IMAGES[categoryFallback.slug];
    }
    if (
      categoryFallback.image &&
      cleanImageUrl(categoryFallback.image) &&
      !categoryFallback.image.endsWith(".svg") &&
      !categoryFallback.image.includes("vsoilmill")
    ) {
      return cleanImageUrl(categoryFallback.image);
    }
  }

  // 5. Default fallback to Coconut Oil studio photo
  return ASSETS.PLACEHOLDER_PRODUCT;
}
