import { ComboCard } from "@/components/features/catalog/ComboCard";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHero } from "@/components/shared/PageHero";
import { EmptyState } from "@/components/shared/EmptyState";
import { Package } from "lucide-react";
import { CATALOG_COPY } from "@/constants/catalog";
import { LAYOUT } from "@/constants/layout";
import { getLiveCombos } from "@/lib/catalog/highlights";

export const dynamic = "force-dynamic";

export default async function CombosPage() {
  const combos = await getLiveCombos();
  return (
    <>
      <PageHero eyebrow="Value bundles" title={CATALOG_COPY.combosTitle} />
      <PageContainer className="py-10 md:py-14">
      {combos.length ? (
        <div className={LAYOUT.productGrid}>
          {combos.map((combo) => (
            <ComboCard key={combo._id} combo={combo} />
          ))}
        </div>
      ) : (
        <EmptyState icon={<Package />} title={CATALOG_COPY.combosEmpty} />
      )}
      </PageContainer>
    </>
  );
}
