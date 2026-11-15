import { ProductCard } from "@/components/shared/ProductCard";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHero } from "@/components/shared/PageHero";
import { EmptyState } from "@/components/shared/EmptyState";
import { Tag } from "lucide-react";
import { CATALOG_COPY } from "@/constants/catalog";
import { LAYOUT } from "@/constants/layout";
import { getLiveOffers } from "@/lib/catalog/highlights";

export const dynamic = "force-dynamic";

export default async function OffersPage() {
  const products = await getLiveOffers();
  return (
    <>
      <PageHero eyebrow="Limited time" title={CATALOG_COPY.offersTitle} />
      <PageContainer className="py-10 md:py-14">
      {products.length ? (
        <div className={LAYOUT.productGrid}>
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      ) : (
        <EmptyState icon={<Tag />} title={CATALOG_COPY.offersEmpty} />
      )}
      </PageContainer>
    </>
  );
}
