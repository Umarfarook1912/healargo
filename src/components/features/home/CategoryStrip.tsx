"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";
import { Stagger, StaggerItem } from "@/components/shared/motion";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionHeading } from "@/components/features/home/SectionHeading";
import { ASSETS } from "@/constants/assets";
import { MASCOTS } from "@/constants/mascots";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils/cn";
import { stripHtml } from "@/lib/utils/format";
import type { Category } from "@/types/product";

interface CategoryTheme {
  bg: string;
  border: string;
  badgeBg: string;
  badgeText: string;
  imageBg: string;
  arrowBg: string;
  arrowText: string;
  defaultImage: string;
  mascot: string;
}

function getCategoryTheme(slug: string, index: number): CategoryTheme {
  const s = slug.toLowerCase();
  if (s.includes("coconut") || s.includes("thengai")) {
    return {
      bg: "bg-[#D8F3EC]",
      border: "border-[#8EDBD0]/70",
      badgeBg: "bg-[#8EDBD0]",
      badgeText: "text-[#263D2E]",
      imageBg: "bg-[#FFFFFF]/70",
      arrowBg: "bg-[#8EDBD0]/40 group-hover:bg-[#4F8A45]",
      arrowText: "text-[#263D2E] group-hover:text-white",
      defaultImage: ASSETS.CATEGORIES.COCONUT,
      mascot: MASCOTS.coconut.image,
    };
  }
  if (s.includes("sesame") || s.includes("gingelly") || s.includes("traditional")) {
    return {
      bg: "bg-[#FFF0B8]",
      border: "border-[#FFD45A]/80",
      badgeBg: "bg-[#FFD45A]",
      badgeText: "text-[#263D2E]",
      imageBg: "bg-[#FFFFFF]/70",
      arrowBg: "bg-[#FFD45A]/50 group-hover:bg-[#4F8A45]",
      arrowText: "text-[#263D2E] group-hover:text-white",
      defaultImage: ASSETS.CATEGORIES.SESAME,
      mascot: MASCOTS.sesame.image,
    };
  }
  if (s.includes("castor") || s.includes("amanakku")) {
    return {
      bg: "bg-[#FFE0D4]",
      border: "border-[#FF8066]/50",
      badgeBg: "bg-[#FF8066]",
      badgeText: "text-white",
      imageBg: "bg-[#FFFFFF]/70",
      arrowBg: "bg-[#FF8066]/30 group-hover:bg-[#4F8A45]",
      arrowText: "text-[#263D2E] group-hover:text-white",
      defaultImage: ASSETS.CATEGORIES.CASTOR,
      mascot: MASCOTS["oil-drop"].image,
    };
  }
  if (s.includes("ghee") || s.includes("uthukuli") || s.includes("ney")) {
    return {
      bg: "bg-[#FFF0B8]",
      border: "border-[#FFD45A]/80",
      badgeBg: "bg-[#FFD45A]",
      badgeText: "text-[#263D2E]",
      imageBg: "bg-[#FFFFFF]/70",
      arrowBg: "bg-[#FFD45A]/50 group-hover:bg-[#4F8A45]",
      arrowText: "text-[#263D2E] group-hover:text-white",
      defaultImage: ASSETS.CATEGORIES.GHEE,
      mascot: MASCOTS["oil-drop"].image,
    };
  }
  // Light Leaf default
  const fallbacks: CategoryTheme[] = [
    {
      bg: "bg-[#DDECCF]",
      border: "border-[#4F8A45]/30",
      badgeBg: "bg-[#4F8A45]",
      badgeText: "text-white",
      imageBg: "bg-[#FFFFFF]/70",
      arrowBg: "bg-[#4F8A45]/20 group-hover:bg-[#4F8A45]",
      arrowText: "text-[#263D2E] group-hover:text-white",
      defaultImage: ASSETS.HERO_BANNER,
      mascot: MASCOTS.leaf.image,
    },
    {
      bg: "bg-[#FFF0B8]",
      border: "border-[#FFD45A]/70",
      badgeBg: "bg-[#FFD45A]",
      badgeText: "text-[#263D2E]",
      imageBg: "bg-[#FFFFFF]/70",
      arrowBg: "bg-[#FFD45A]/50 group-hover:bg-[#4F8A45]",
      arrowText: "text-[#263D2E] group-hover:text-white",
      defaultImage: ASSETS.CATEGORIES.SESAME,
      mascot: MASCOTS["oil-drop"].image,
    },
    {
      bg: "bg-[#D8F3EC]",
      border: "border-[#8EDBD0]/60",
      badgeBg: "bg-[#8EDBD0]",
      badgeText: "text-[#263D2E]",
      imageBg: "bg-[#FFFFFF]/70",
      arrowBg: "bg-[#8EDBD0]/40 group-hover:bg-[#4F8A45]",
      arrowText: "text-[#263D2E] group-hover:text-white",
      defaultImage: ASSETS.CATEGORIES.COCONUT,
      mascot: MASCOTS.coconut.image,
    },
  ];
  return fallbacks[index % fallbacks.length];
}

export function CategoryStrip({ categories }: { categories: Category[] }) {
  // Filter out legacy non-HEALARGO categories (e.g. home-cleaning, oil-cakes)
  const visibleCategories = categories.filter(
    (c) =>
      c.slug !== "home-cleaning" &&
      c.slug !== "oil-cakes" &&
      !c.slug.includes("cleaning") &&
      !c.slug.includes("groundnut") &&
      !c.slug.includes("peanut")
  );

  if (!visibleCategories.length) return null;

  return (
    <section className="py-16 md:py-24">
      <PageContainer>
        <SectionHeading
          eyebrow={
            <span className="inline-flex items-center gap-1.5 font-extrabold text-[#4F8A45]">
              <Sparkles className="h-4 w-4 text-[#FFD45A]" />
              Sourced With Integrity
            </span>
          }
          title="Shop by Category"
          description="Explore our vibrant range of pure cold-pressed oils, gently extracted to retain full natural aroma, nutrients, and goodness."
          action={
            <Link
              href={ROUTES.SHOP}
              className="group inline-flex items-center gap-2 text-sm font-bold text-[#4F8A45] transition hover:text-[#263D2E]"
            >
              <span className="border-b-2 border-[#4F8A45]/40 pb-0.5 transition-colors group-hover:border-[#4F8A45]">
                Browse all products
              </span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          }
        />

        <Stagger
          className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          delay={0.05}
        >
          {visibleCategories.map((category, index) => {
            const theme = getCategoryTheme(category.slug, index);
            const description = stripHtml(category.description || "");

            // Pick the appropriate vibrant HEALARGO image
            const isLegacy =
              !category.image ||
              category.image.includes("vsoilmill") ||
              category.image.endsWith(".svg") ||
              category.image.includes("unsplash.com") ||
              category.image.includes("clean_tool");
            const imageUrl: string =
              (isLegacy || !category.image ? theme.defaultImage : category.image) ||
              theme.defaultImage;

            return (
              <StaggerItem key={category._id}>
                <Link
                  href={ROUTES.CATEGORY(category.slug)}
                  className={cn(
                    "group relative flex flex-col justify-between overflow-hidden rounded-3xl border p-5 sm:p-6 shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[var(--shadow-lifted)]",
                    theme.bg,
                    theme.border
                  )}
                >
                  {/* Category Image in a crisp rounded frame */}
                  <div className={cn("relative aspect-4/3 w-full overflow-hidden rounded-2xl border border-white/60 shadow-xs", theme.imageBg)}>
                    <Image
                      src={imageUrl}
                      alt={category.name}
                      fill
                      unoptimized
                      className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-108"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />

                    {category.badge ? (
                      <span
                        className={cn(
                          "absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-extrabold shadow-sm",
                          theme.badgeBg,
                          theme.badgeText
                        )}
                      >
                        {category.badge}
                      </span>
                    ) : null}

                    {/* Peeking Mascot on Category Card */}
                    <div
                      aria-hidden
                      className="pointer-events-none absolute -bottom-1 -right-1 z-10 h-11 w-11 sm:h-13 sm:w-13 drop-shadow-md transition-all duration-300 transform translate-y-2 opacity-85 group-hover:translate-y-0 group-hover:opacity-100 group-hover:scale-110"
                    >
                      <Image
                        src={theme.mascot}
                        alt=""
                        width={52}
                        height={52}
                        unoptimized
                        className="h-full w-full object-contain animate-bounce-subtle"
                      />
                    </div>
                  </div>

                  {/* Category details with clean dark typography */}
                  <div className="mt-5 flex flex-1 flex-col justify-between">
                    <div>
                      <h3 className="font-display text-xl sm:text-2xl font-bold leading-snug text-[#263D2E] transition-colors group-hover:text-[#4F8A45]">
                        {category.name}
                      </h3>
                      {description ? (
                        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-[#72776A] sm:text-sm">
                          {description}
                        </p>
                      ) : null}
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-[#263D2E]/10 pt-3">
                      <span className="text-xs font-bold text-[#4F8A45] group-hover:text-[#263D2E] transition-colors">
                        Explore Collection
                      </span>
                      <span
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 shadow-2xs",
                          theme.arrowBg,
                          theme.arrowText
                        )}
                      >
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
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
