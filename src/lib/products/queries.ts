import { prisma } from "@/lib/db/prisma";
import { mapCategories, mapCategory, mapProduct, mapProducts } from "@/lib/db/catalog";
import type { Product, Category } from "@/types/product";

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
    const normTarget = cleanSlug.replace(/[^a-z0-9]/g, "");

    const category = categories.find((c) => {
      const cClean = c.slug.trim().toLowerCase();
      if (cClean === cleanSlug) return true;
      const cNorm = cClean.replace(/[^a-z0-9]/g, "");
      return cNorm === normTarget || (cNorm.length > 3 && normTarget.length > 3 && (cNorm.includes(normTarget) || normTarget.includes(cNorm)));
    });

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

  // Smart fallback: If exact slug is not found, find matching active product by slug keywords or substring
  const activeProducts = await prisma.product.findMany({
    where: { isActive: true },
    include: { category: true },
  });

  const targetLower = cleanSlug.toLowerCase();
  const targetTokens = targetLower.split(/[-_\s]+/).filter((t) => t.length > 2);

  // 1. Direct contains check: target contains product slug or vice versa
  let matched = activeProducts.find((p) => {
    const pSlug = (p.slug || "").toLowerCase();
    return pSlug && (targetLower.includes(pSlug) || pSlug.includes(targetLower));
  });

  // 2. Token match: matching key word tokens (e.g. "groundnut", "sesame", "coconut", "ghee", "castor", "neem", "mahua", "pongam", "sugar", "honey")
  if (!matched && targetTokens.length > 0) {
    matched = activeProducts.find((p) => {
      const pSlug = (p.slug || "").toLowerCase();
      const pName = (p.name || "").toLowerCase();
      return targetTokens.some((token) => pSlug.includes(token) || pName.includes(token));
    });
  }

  if (matched) {
    return mapProduct(matched);
  }

  return null;
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
  const normTarget = cleanSlug.replace(/[^a-z0-9]/g, "");

  const category = categories.find((c) => {
    const cClean = c.slug.trim().toLowerCase();
    if (cClean === cleanSlug) return true;
    const cNorm = cClean.replace(/[^a-z0-9]/g, "");
    return cNorm === normTarget || (cNorm.length > 3 && normTarget.length > 3 && (cNorm.includes(normTarget) || normTarget.includes(cNorm)));
  });

  if (!category) return null;
  return mapCategory(category);
}
