import { notFound } from "next/navigation";
import { AdminProductForm } from "@/components/features/admin/AdminProductForm";
import { AdminCard, AdminPageHeader } from "@/components/features/admin/AdminUi";
import { mapCategories, mapProduct } from "@/lib/db/catalog";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function AdminEditProductPage({ params }: Props) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  if (!product) notFound();

  return (
    <div>
      <AdminPageHeader
        title="Edit product"
        description="Update pricing, variants, visibility, and SEO metadata."
      />
      <AdminCard className="p-6 md:p-8">
        <AdminProductForm
          categories={mapCategories(categories)}
          product={mapProduct(product)}
        />
      </AdminCard>
    </div>
  );
}
