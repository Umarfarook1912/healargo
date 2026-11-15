import Link from "next/link";
import { ProductGrid } from "@/components/features/products/ProductGrid";
import { FadeIn } from "@/components/shared/motion";
import { PageContainer } from "@/components/layout/PageContainer";
import { LAYOUT } from "@/constants/layout";
import { ROUTES } from "@/constants/routes";
import type { Product } from "@/types/product";

export function BestSellersSection({ products }: { products: Product[] }) {
  return (
    <section className={LAYOUT.sectionY}>
      <PageContainer>
      <FadeIn className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">
            Best Sellers
          </p>
          <h2 className="mt-3 font-display text-3xl text-dark md:text-5xl md:leading-tight">
            Our Most Loved Products
          </h2>
        </div>
        <Link
          href={ROUTES.SHOP}
          className="inline-flex shrink-0 items-center rounded-full border border-primary/25 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          View All Products →
        </Link>
      </FadeIn>
      <ProductGrid products={products} />
      </PageContainer>
    </section>
  );
}
