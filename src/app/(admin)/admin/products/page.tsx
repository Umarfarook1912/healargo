import { AdminProductsClient } from "@/components/features/admin/AdminProductsClient";
import { mapProducts } from "@/lib/db/catalog";
import { prisma } from "@/lib/db/prisma";
import type { AdminProductRow } from "@/types/admin-list";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = mapProducts(
    await prisma.product.findMany({
      include: { category: true },
      orderBy: { createdAt: "desc" },
    }),
  ) as AdminProductRow[];

  return <AdminProductsClient products={products} />;
}
