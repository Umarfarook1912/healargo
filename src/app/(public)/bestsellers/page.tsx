import type { Metadata } from "next";
import { ProductGrid } from "@/components/features/products/ProductGrid";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHero } from "@/components/shared/PageHero";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getProducts } from "@/lib/products/queries";
import type { Product } from "@/types/product";

export const metadata: Metadata = buildPageMetadata({
  title: "Bestsellers",
  description:
    "Shop HEALARGO bestsellers including cold-pressed edible oils, natural ghee, and customer favourites.",
  path: "/bestsellers",
});

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BestsellersPage() {
  let products: Product[] = [];
  try {
    products = await getProducts({ bestSeller: true });
  } catch {
    products = [];
  }

  return (
    <>
      <PageHero
        eyebrow="Customer Favourites"
        title="Bestsellers"
        description="Our most loved cold-pressed oils and natural everyday essentials."
      />
      <PageContainer className="py-10 md:py-14">
        <ProductGrid products={products} />
      </PageContainer>
    </>
  );
}
