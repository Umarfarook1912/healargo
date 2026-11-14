import { AdminProductForm } from "@/components/features/admin/AdminProductForm";
import { AdminCard, AdminPageHeader } from "@/components/features/admin/AdminUi";
import { mapCategories } from "@/lib/db/catalog";
import { prisma } from "@/lib/db/prisma";

export default async function AdminNewProductPage() {
  const categories = mapCategories(
    await prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
  );

  return (
    <div>
      <AdminPageHeader
        title="Add product"
        description="Create a new oil or ghee listing with variants and SEO."
      />
      <AdminCard className="p-6 md:p-8">
        <AdminProductForm categories={categories} />
      </AdminCard>
    </div>
  );
}
