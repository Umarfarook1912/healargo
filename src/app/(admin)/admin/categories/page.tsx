import { AdminCategoriesClient } from "@/components/features/admin/AdminCategoriesClient";
import { mapCategories } from "@/lib/db/catalog";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = mapCategories(
    await prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
  );

  return <AdminCategoriesClient categories={categories} />;
}
