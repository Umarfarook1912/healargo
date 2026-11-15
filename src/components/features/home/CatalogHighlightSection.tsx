import Link from "next/link";
import { ArrowRight, Sparkles, Tag } from "lucide-react";
import { ComboCard } from "@/components/features/catalog/ComboCard";
import { ProductCard } from "@/components/shared/ProductCard";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionHeading } from "@/components/features/home/SectionHeading";
import { Button } from "@/components/ui/button";
import { CATALOG_COPY } from "@/constants/catalog";
import { LAYOUT } from "@/constants/layout";
import { ROUTES } from "@/constants/routes";
import type { ComboOffer } from "@/types/combo";
import type { Product } from "@/types/product";

export function OffersSection({ products }: { products: Product[] }) {
  if (!products.length) return null;
  return (
    <section className="py-16 md:py-24">
      <PageContainer>
        <div className="relative overflow-hidden rounded-[2rem] border border-accent/25 bg-accent-soft/70 p-5 sm:p-8 lg:p-12">
          <span aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
          <SectionHeading
            eyebrow={
              <span className="inline-flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5" /> Limited time
              </span>
            }
            title={CATALOG_COPY.homeOffers}
            className="relative"
            action={
              <Button variant="outline" className="gap-1.5 bg-card" asChild>
                <Link href={ROUTES.OFFERS}>
                  View all
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            }
          />
          <div className={LAYOUT.productGrid}>
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </div>
      </PageContainer>
    </section>
  );
}

export function CombosSection({ combos }: { combos: ComboOffer[] }) {
  if (!combos.length) return null;
  return (
    <section className="relative overflow-hidden bg-primary-soft/60 py-16 md:py-24">
      <span aria-hidden className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full border border-primary/10" />
      <span aria-hidden className="pointer-events-none absolute -right-16 bottom-0 h-56 w-56 rounded-full border border-accent/25" />
      <PageContainer className="relative">
        <SectionHeading
          eyebrow={
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Special Value Bundles
            </span>
          }
          title={CATALOG_COPY.homeCombos}
          description="Curated pure cold pressed oil bundles and special combo offers crafted for traditional cooking."
          action={
            <Button className="gap-1.5" asChild>
              <Link href={ROUTES.COMBOS}>
                <span>View all combos</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          }
        />
        <div className={LAYOUT.productGrid}>
          {combos.map((combo) => (
            <ComboCard key={combo._id} combo={combo} />
          ))}
        </div>
      </PageContainer>
    </section>
  );
}
