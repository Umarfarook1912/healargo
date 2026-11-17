import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/features/products/ProductGrid";
import { CategoryHero } from "@/components/features/categories/CategoryHero";
import { PageContainer } from "@/components/layout/PageContainer";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { stripHtml } from "@/lib/utils/format";
import {
  getCategories,
  getCategoryBySlug,
  getProducts,
} from "@/lib/products/queries";
import type { Category, Product } from "@/types/product";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const category = await getCategoryBySlug(slug);
    if (!category) return {};
    return buildPageMetadata({
      title: category.name,
      description:
        stripHtml(category.description ?? "") ||
        `Shop ${category.name} from HEALARGO.`,
      path: `/categories/${slug}`,
    });
  } catch {
    return {};
  }
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  let category: Category | null = null;
  let allCategories: Category[] = [];
  let products: Product[] = [];

  try {
    const [fetchedCategory, fetchedCategories] = await Promise.all([
      getCategoryBySlug(slug),
      getCategories(),
    ]);

    category = fetchedCategory;
    allCategories = fetchedCategories.filter((c) => c.slug !== "home-cleaning" && !c.slug.includes("cleaning"));

    if (category) {
      const rawProducts = await getProducts({ categorySlug: slug });
      products = rawProducts.filter(
        (p) => !p.slug.includes("cleaning") && !p.name.toLowerCase().includes("cleaning")
      );
    }
  } catch {
    category = null;
  }

  if (!category || category.slug === "home-cleaning" || category.slug.includes("cleaning")) notFound();

  return (
    <PageContainer className="space-y-10 py-8 md:py-12">
      <CategoryHero category={category} allCategories={allCategories} />

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5">
          <h2 className="font-display text-2xl text-dark md:text-3xl">
            Products in {category.name}
          </h2>
          <span className="rounded-full border border-primary/15 bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
            {products.length} product{products.length !== 1 ? "s" : ""}
          </span>
        </div>

        <ProductGrid products={products} />
      </div>
    </PageContainer>
  );
}
