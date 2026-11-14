import type { Metadata } from "next";
import { ProductGrid } from "@/components/features/products/ProductGrid";
import { PageContainer } from "@/components/layout/PageContainer";
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
    <PageContainer className="py-12">
      <h1 className="font-display text-4xl text-dark">Shop</h1>
      <p className="mt-2 text-muted">
        Explore thoughtfully sourced products and order online with ease.
      </p>
      <div className="mt-10">
        <ProductGrid products={products} />
      </div>
    </PageContainer>
  );
}
