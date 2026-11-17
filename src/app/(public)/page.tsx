import { BrandIntroSection } from "@/components/features/home/BrandIntroSection";
import { CombosSection, OffersSection } from "@/components/features/home/CatalogHighlightSection";
import { CategoryStrip } from "@/components/features/home/CategoryStrip";
import { HomeFaqTeaser } from "@/components/features/home/HomeFaqTeaser";
import { HomeHero } from "@/components/features/home/HomeHero";
import { HomeProductShowcase } from "@/components/features/home/HomeProductShowcase";
import { HomeProofSection } from "@/components/features/home/HomeProofSection";
import { LifestyleSection } from "@/components/features/home/LifestyleSection";
import { NewsletterSection } from "@/components/features/home/NewsletterSection";
import { ProcessSection } from "@/components/features/home/ProcessSection";
import { PromoBanner } from "@/components/features/home/PromoBanner";
import { TestimonialsSection } from "@/components/features/home/TestimonialsSection";
import { TrustStrip } from "@/components/features/home/TrustStrip";
import { WhyUsSection } from "@/components/features/home/WhyUsSection";
import { CornerMascot } from "@/components/features/mascots/CornerMascot";
import { getLiveCombos, getLiveOffers } from "@/lib/catalog/highlights";
import { getCategories, getProducts } from "@/lib/products/queries";
import type { ComboOffer } from "@/types/combo";
import type { Category, Product } from "@/types/product";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  let categories: Category[] = [];
  let products: Product[] = [];
  let offers: Product[] = [];
  let combos: ComboOffer[] = [];

  try {
    [categories, products, offers, combos] = await Promise.all([
      getCategories(),
      getProducts(),
      getLiveOffers(),
      getLiveCombos(),
    ]);
  } catch {
    categories = [];
    products = [];
    offers = [];
    combos = [];
  }

  return (
    <>
      {/* 1. Flagship Vibrant Playful Nature Hero */}
      <HomeHero />
      {/* 2. Brand benefits & trust badges */}
      <TrustStrip />
      {/* 3. Brand introduction section */}
      <BrandIntroSection />
      {/* 4. Category showcase */}
      <CategoryStrip categories={categories} />
      {/* 5. Collection with bestseller / new arrival filters */}
      <HomeProductShowcase products={products} categories={categories} />
      {/* 6. Lifestyle / Editorial section */}
      <LifestyleSection />
      {/* 7. Combos (only when live combos exist) */}
      <CombosSection combos={combos} />
      {/* 8. Brand story & Process */}
      <WhyUsSection />
      <ProcessSection />
      {/* 9. Offers (only when live offers exist) */}
      <OffersSection products={offers} />
      {/* 10. Social proof, gallery & certificates, FAQs */}
      <TestimonialsSection />
      <HomeProofSection />
      <HomeFaqTeaser />
      {/* 11. Customer engagement newsletter */}
      <NewsletterSection />
      {/* 12. Closing CTA */}
      <PromoBanner />
      {/* 13. Interactive Corner Mascot */}
      <CornerMascot mascot="coconut" corner="bottom-left" delay={2} />
    </>
  );
}
