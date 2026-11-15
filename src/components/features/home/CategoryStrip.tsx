import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { Stagger, StaggerItem } from "@/components/shared/motion";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionHeading } from "@/components/features/home/SectionHeading";
import { ASSETS } from "@/constants/assets";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils/cn";
import { stripHtml } from "@/lib/utils/format";
import type { Category } from "@/types/product";

const DEFAULT_CATEGORY_IMAGES: Record<string, string> = {
  "wood-pressed-oils": ASSETS.PLACEHOLDER_PRODUCT,
  "pure-cow-ghee": ASSETS.PLACEHOLDER_PRODUCT,
  "traditional-oils": ASSETS.PLACEHOLDER_PRODUCT,
  "oil-cakes": ASSETS.PLACEHOLDER_PRODUCT,
  "combo-offers": ASSETS.PLACEHOLDER_PRODUCT,
  "home-cleaning": ASSETS.PLACEHOLDER_PRODUCT,
  "honey-dry-nuts": ASSETS.PLACEHOLDER_PRODUCT,
};

export function CategoryStrip({ categories }: { categories: Category[] }) {
  if (!categories.length) return null;

  return (
    <section className="py-16 md:py-24">
      <PageContainer>
        <SectionHeading
          eyebrow="Shop by Category"
          title="Shop Natural Wellness"
          action={
            <Link
              href={ROUTES.SHOP}
              className="group inline-flex items-center gap-2 text-sm font-semibold text-primary"
            >
              <span className="border-b border-primary/30 pb-0.5 transition-colors group-hover:border-primary">
                Browse all products
              </span>
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          }
        />
        <Stagger
          className="grid w-full grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4"
          delay={0.05}
        >
          {categories.map((category, index) => {
            const isSvgImage = category.image?.endsWith(".svg");
            const isUnsplash = category.image?.includes("unsplash.com");
            const imageUrl =
              (category.image && !isSvgImage && !isUnsplash
                ? category.image
                : DEFAULT_CATEGORY_IMAGES[category.slug]) ||
              DEFAULT_CATEGORY_IMAGES[category.slug] ||
              DEFAULT_CATEGORY_IMAGES["wood-pressed-oils"];
            const description = stripHtml(category.description || "");

            return (
              <StaggerItem key={category._id}>
                <Link
                  href={ROUTES.CATEGORY(category.slug)}
                  className={cn(
                    "group relative isolate flex aspect-[4/5] h-full w-full flex-col justify-end overflow-hidden rounded-3xl bg-cream shadow-[var(--shadow-soft)] ring-1 ring-border/70 transition-shadow duration-300 hover:shadow-[var(--shadow-lifted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    index === 0 && "xl:col-span-2 xl:aspect-auto",
                  )}
                >
                  <Image
                    src={imageUrl}
                    alt={category.name}
                    fill
                    className="-z-10 object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
                  />
                  <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-dark/90 via-dark/35 to-transparent" />

                  {category.badge ? (
                    <span className="absolute left-3 top-3 rounded-full bg-accent px-3 py-1 text-[11px] font-semibold text-accent-foreground shadow-md sm:left-4 sm:top-4">
                      {category.badge}
                    </span>
                  ) : null}
                  <span
                    aria-hidden
                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-primary shadow-md transition-all duration-300 group-hover:bg-accent group-hover:text-accent-foreground sm:right-4 sm:top-4 sm:h-10 sm:w-10"
                  >
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:rotate-45" />
                  </span>

                  <div className="p-4 sm:p-6">
                    <h3 className="font-display text-lg leading-snug text-white sm:text-2xl">
                      {category.name}
                    </h3>
                    {description ? (
                      <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-cream/80 sm:text-sm">
                        {description}
                      </p>
                    ) : null}
                    <span className="mt-3 inline-flex items-center text-xs font-semibold text-accent">
                      Explore Collection
                    </span>
                  </div>
                </Link>
              </StaggerItem>
            );
          })}
        </Stagger>
      </PageContainer>
    </section>
  );
}
