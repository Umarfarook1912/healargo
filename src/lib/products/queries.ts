import { prisma } from "@/lib/db/prisma";
import { mapCategories, mapCategory, mapProduct, mapProducts } from "@/lib/db/catalog";
import type { Product, Category } from "@/types/product";

/**
 * Resolves a category URL slug. An exact slug wins, then a slug that differs
 * only in case or separators ("WOOD_PRESSED_OILS"). Only then a partial match
 * ("woodpressed"), choosing the closest one: a short slug such as "oils" must
 * not capture "/categories/wood-pressed-oils" just because it sorts first.
 */
function findCategoryBySlug<T extends { slug: string }>(categories: T[], cleanSlug: string): T | undefined {
  const norm = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  const normTarget = norm(cleanSlug);
  const exact = categories.find((c) => c.slug.trim().toLowerCase() === cleanSlug);
  if (exact) return exact;
  if (!normTarget) return undefined;
  const sameNorm = categories.find((c) => norm(c.slug) === normTarget);
  if (sameNorm) return sameNorm;
  if (normTarget.length <= 3) return undefined;
  const partial = categories.filter((c) => {
    const cNorm = norm(c.slug);
    return cNorm.length > 3 && (cNorm.includes(normTarget) || normTarget.includes(cNorm));
  });
  // Stable sort keeps sortOrder for ties.
  partial.sort(
    (a, b) => Math.abs(norm(a.slug).length - normTarget.length) - Math.abs(norm(b.slug).length - normTarget.length),
  );
  return partial[0];
}

export async function getProducts(filters?: {
  bestSeller?: boolean;
  newArrival?: boolean;
  categorySlug?: string;
  activeOnly?: boolean;
}): Promise<Product[]> {
  const query: Record<string, unknown> = {};
  if (filters?.activeOnly !== false) query.isActive = true;
  if (filters?.bestSeller) query.isBestSeller = true;
  if (filters?.newArrival) query.isNewArrival = true;

  if (filters?.categorySlug) {
    const cleanSlug = decodeURIComponent(filters.categorySlug).trim().toLowerCase();
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    const category = findCategoryBySlug(categories, cleanSlug);

    if (!category) return [];
    query.categoryId = category.id;
  }

  const products = await prisma.product.findMany({
    where: query,
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });
  return mapProducts(products);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const cleanSlug = decodeURIComponent(slug).trim();
  const product = await prisma.product.findFirst({
    where: {
      slug: { equals: cleanSlug, mode: "insensitive" },
      isActive: true,
    },
    include: { category: true },
  });
  if (product) return mapProduct(product);

  // Fallback for legacy links that differ only in separators or case
  // (e.g. "Groundnut_Oil" -> "groundnut-oil"). Never serve a different product
  // just because one word matches.
  const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
  const target = normalize(cleanSlug);
  if (!target) return null;
  const activeProducts = await prisma.product.findMany({
    where: { isActive: true },
    include: { category: true },
  });
  const matches = activeProducts.filter((p) => normalize(p.slug || "") === target);
  return matches.length === 1 ? mapProduct(matches[0]) : null;
}

export async function getCategories(activeOnly = true): Promise<Category[]> {
  const categories = await prisma.category.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    orderBy: { sortOrder: "asc" },
  });
  return mapCategories(categories);
}

export async function getCategoryBySlug(
  slug: string,
): Promise<Category | null> {
  const cleanSlug = decodeURIComponent(slug).trim().toLowerCase();
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  const category = findCategoryBySlug(categories, cleanSlug);

  if (!category) return null;
  return mapCategory(category);
}
