import { AdminCouponsClient } from "@/components/features/admin/AdminCouponsClient";
import { mapCategories, normalizeProductVariants } from "@/lib/db/catalog";
import { mapCoupons } from "@/lib/db/orders";
import { prisma } from "@/lib/db/prisma";
import type { Coupon } from "@/types/coupon";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  const [rawCoupons, rawCategories, rawProducts] = await Promise.all([
    prisma.coupon.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({ orderBy: { name: "asc" } }),
  ]);

  const coupons: Coupon[] = mapCoupons(rawCoupons);
  const categories = mapCategories(rawCategories);
  const products = rawProducts.map((product) => ({
    _id: product.id,
    name: product.name,
    categoryId: product.categoryId,
    images: product.images,
    variants: normalizeProductVariants(product.variants).map((variant) => ({
      _id: variant._id ?? "",
      label: variant.label,
      price: variant.price,
      sku: variant.sku,
      stock: variant.stock,
    })),
  }));

  const now = new Date();
  const total = coupons.length;
  const active = coupons.filter(
    (c: Coupon) => c.status === "ACTIVE" && new Date(c.validTo) >= now,
  ).length;
  const expired = coupons.filter((c: Coupon) => new Date(c.validTo) < now).length;
  const totalRedemptions = coupons.reduce(
    (sum: number, c: Coupon) => sum + (c.timesUsed || 0),
    0,
  );

  return (
    <AdminCouponsClient
      initialCoupons={coupons}
      categories={categories}
      products={products}
      stats={{
        total,
        active,
        expired,
        totalRedemptions,
      }}
    />
  );
}
