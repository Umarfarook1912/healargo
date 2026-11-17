"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { ProductGrid } from "@/components/features/products/ProductGrid";
import { ShowcaseFilterBar } from "@/components/features/home/ShowcaseFilterBar";
import { ScaleOnHover } from "@/components/shared/motion";
import { SectionHeading } from "@/components/features/home/SectionHeading";
import { PageContainer } from "@/components/layout/PageContainer";
import { FILTER_ALL, HOME_COPY } from "@/constants/home";
import { LAYOUT } from "@/constants/layout";
import { ROUTES } from "@/constants/routes";
import { matchesProductCategory } from "@/lib/products/match-category";
import { cn } from "@/lib/utils/cn";
import type { HomeProductShowcaseProps, ShowcaseTab } from "@/types/home";

export function HomeProductShowcase({
  products = [],
  categories = [],
}: HomeProductShowcaseProps) {
  const [activeTab, setActiveTab] = useState<ShowcaseTab>(FILTER_ALL);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState(FILTER_ALL);

  // Filter out any legacy non-HEALARGO products (e.g. home-cleaning)
  const validProducts = useMemo(() => {
    return products.filter((p) => {
      const catSlug =
        typeof p.categoryId === "object" && p.categoryId !== null
          ? (p.categoryId as { slug?: string }).slug
          : "";
      return (
        catSlug !== "home-cleaning" &&
        !p.slug.includes("cleaning") &&
        !p.name.toLowerCase().includes("cleaning")
      );
    });
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = validProducts;

    if (activeTab === "bestsellers") {
      result = result.filter((p) => p.isBestSeller);
    } else if (activeTab === "newarrivals") {
      result = result.filter((p) => p.isNewArrival);
    }

    if (selectedCategorySlug !== FILTER_ALL) {
      result = result.filter((p) =>
        matchesProductCategory(p, selectedCategorySlug, categories),
      );
    }

    return result;
  }, [validProducts, activeTab, selectedCategorySlug, categories]);

  function handleCategorySelect(slug: string) {
    setSelectedCategorySlug(slug);
    setActiveTab(FILTER_ALL);
  }

  function handleTabSelect(tab: ShowcaseTab) {
    setActiveTab(tab);
    setSelectedCategorySlug(FILTER_ALL);
  }

  function resetFilters() {
    setActiveTab(FILTER_ALL);
    setSelectedCategorySlug(FILTER_ALL);
  }

  return (
    <section className={cn(LAYOUT.sectionY, "relative bg-cream/50 md:py-24")}>
      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <PageContainer>
        <SectionHeading
          align="center"
          eyebrow={HOME_COPY.eyebrow}
          title={HOME_COPY.collectionTitle}
          description={HOME_COPY.collectionSubtitle}
          className="md:mb-10"
        />

        <ShowcaseFilterBar
          products={validProducts}
          categories={categories}
          activeTab={activeTab}
          selectedCategorySlug={selectedCategorySlug}
          onTabSelect={handleTabSelect}
          onCategorySelect={handleCategorySelect}
        />

        {filteredProducts.length > 0 ? (
          <ProductGrid
            products={filteredProducts}
            resetKey={`${activeTab}-${selectedCategorySlug}`}
          />
        ) : (
          <div className="surface-card mx-auto my-8 max-w-md p-10 text-center sm:p-12">
            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
              <ShoppingBag className="h-6 w-6" />
            </span>
            <h3 className="font-display text-xl font-semibold text-dark">
              {HOME_COPY.noProductsTitle}
            </h3>
            <p className="mt-1.5 text-sm text-muted">{HOME_COPY.noProductsBody}</p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-5 rounded-full border border-primary/30 px-5 py-2 text-sm font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground"
            >
              {HOME_COPY.resetFilters}
            </button>
          </div>
        )}

        <div className="mt-12 flex justify-center">
          <ScaleOnHover className="inline-block">
            <Link
              href={ROUTES.SHOP}
              className="group inline-flex items-center gap-2 rounded-full bg-dark px-8 py-3.5 text-sm font-semibold text-white shadow-[var(--shadow-lifted)] transition-colors hover:bg-primary"
            >
              <span>{HOME_COPY.viewCatalog}</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </ScaleOnHover>
        </div>
      </PageContainer>
    </section>
  );
}
