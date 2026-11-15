import { CombosSection, OffersSection } from "@/components/features/home/CatalogHighlightSection";
import { CategoryStrip } from "@/components/features/home/CategoryStrip";
import { HomeFaqTeaser } from "@/components/features/home/HomeFaqTeaser";
import { HomeHeroCarousel } from "@/components/features/home/HomeHeroCarousel";
import { HomeProductShowcase } from "@/components/features/home/HomeProductShowcase";
import { HomeProofSection } from "@/components/features/home/HomeProofSection";
import { ProcessSection } from "@/components/features/home/ProcessSection";
import { PromoBanner } from "@/components/features/home/PromoBanner";
import { TestimonialsSection } from "@/components/features/home/TestimonialsSection";
import { TrustStrip } from "@/components/features/home/TrustStrip";
import { WhyUsSection } from "@/components/features/home/WhyUsSection";
import { getLiveCombos, getLiveOffers } from "@/lib/catalog/highlights";
import { getCategories, getProducts } from "@/lib/products/queries";
import { getActiveCarousels } from "@/lib/carousels/queries";
import type { ComboOffer } from "@/types/combo";
import type { Category, Product } from "@/types/product";
import type { CarouselSlide } from "@/types/carousel";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  let categories: Category[] = [];
  let products: Product[] = [];
  let carousels: CarouselSlide[] = [];
  let offers: Product[] = [];
  let combos: ComboOffer[] = [];

  try {
    [categories, products, carousels, offers, combos] = await Promise.all([
      getCategories(),
      getProducts(),
      getActiveCarousels(),
      getLiveOffers(),
      getLiveCombos(),
    ]);
  } catch {
    categories = [];
    products = [];
    carousels = [];
    offers = [];
    combos = [];
  }

  return (
    <>
      {/* 1. Hero (admin carousel, falls back to the static brand hero) */}
      <HomeHeroCarousel slides={carousels} />
      {/* 2. Trust badges */}
      <TrustStrip />
      {/* 3. Category showcase */}
      <CategoryStrip categories={categories} />
      {/* 4. Collection with bestseller / new arrival filters */}
      <HomeProductShowcase products={products} categories={categories} />
      {/* 5. Combos (only when live combos exist) */}
      <CombosSection combos={combos} />
      {/* 6. Brand story */}
      <WhyUsSection />
      <ProcessSection />
      {/* 7. Offers (only when live offers exist) */}
      <OffersSection products={offers} />
      {/* 8. Social proof, gallery & certificates, FAQs */}
      <TestimonialsSection />
      <HomeProofSection />
      <HomeFaqTeaser />
      {/* 9. Closing CTA */}
      <PromoBanner />
    </>
  );
}
