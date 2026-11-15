import type { Metadata } from "next";
import { ProductGrid } from "@/components/features/products/ProductGrid";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHero } from "@/components/shared/PageHero";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getProducts } from "@/lib/products/queries";
import type { Product } from "@/types/product";

export const metadata: Metadata = buildPageMetadata({
  title: "Shop All Oils & Ghee",
  description:
    "Browse Healargo products including wood-pressed oils, ghee, and wellness essentials delivered across India.",
  path: "/shop",
});

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ShopPage() {
  let products: Product[] = [];
  try {
    products = await getProducts();
  } catch {
    products = [];
  }

  return (
    <>
      <PageHero
        eyebrow="Healargo Store"
        title="Shop"
        description="Explore thoughtfully sourced products and order online with ease."
      />
      <PageContainer className="py-10 md:py-14">
        <ProductGrid products={products} />
      </PageContainer>
    </>
  );
}
