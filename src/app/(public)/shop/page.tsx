import type { Metadata } from "next";
import { ProductGrid } from "@/components/features/products/ProductGrid";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHero } from "@/components/shared/PageHero";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getProducts } from "@/lib/products/queries";
import type { Product } from "@/types/product";

export const metadata: Metadata = buildPageMetadata({
  title: "Shop All Natural Oils & Foods",
  description:
    "Browse HEALARGO products including cold-pressed oils, pure cow ghee, and natural wellness essentials delivered across India.",
  path: "/shop",
});

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ShopPage() {
  let products: Product[] = [];
  try {
    const raw = await getProducts();
    products = raw.filter(
      (p) => !p.slug.includes("cleaning") && !p.name.toLowerCase().includes("cleaning")
    );
  } catch {
    products = [];
  }

  return (
    <>
      <PageHero
        eyebrow="HEALARGO Store"
        title="Shop Natural Products"
        description="Explore thoughtfully sourced cold-pressed edible oils and pure agro essentials."
      />
      <PageContainer className="py-10 md:py-14">
        <ProductGrid products={products} />
      </PageContainer>
    </>
  );
}
