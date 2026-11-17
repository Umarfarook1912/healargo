"use client";

import { Sparkles, Star, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FILTER_ALL, HOME_COPY } from "@/constants/home";
import { matchesProductCategory } from "@/lib/products/match-category";
import { cn } from "@/lib/utils/cn";
import type { ShowcaseFilterBarProps, ShowcaseTab } from "@/types/home";

const TAB_STYLES: Record<
  ShowcaseTab,
  { active: string; idle: string; badgeActive: string; badgeIdle: string }
> = {
  all: {
    active: "border-[#4F8A45] bg-[#4F8A45] text-white shadow-md shadow-[#4F8A45]/25",
    idle: "border-border/80 bg-white text-[#29352B] hover:border-[#4F8A45]/50 hover:bg-[#DDECCF]/50",
    badgeActive: "bg-white/20 text-white",
    badgeIdle: "bg-[#DDECCF] text-[#4F8A45]",
  },
  bestsellers: {
    active: "border-[#4F8A45] bg-[#4F8A45] text-white shadow-md shadow-[#4F8A45]/25",
    idle: "border-border/80 bg-white text-[#29352B] hover:border-[#4F8A45]/50 hover:bg-[#FFF0B8]/50",
    badgeActive: "bg-[#FFD45A] text-[#263D2E] font-extrabold",
    badgeIdle: "bg-[#FFF0B8] text-[#263D2E]",
  },
  newarrivals: {
    active: "border-[#4F8A45] bg-[#4F8A45] text-white shadow-md shadow-[#4F8A45]/25",
    idle: "border-border/80 bg-white text-[#29352B] hover:border-[#4F8A45]/50 hover:bg-[#FFE0D4]/50",
    badgeActive: "bg-[#FF8066] text-white font-extrabold",
    badgeIdle: "bg-[#FFE0D4] text-[#FF8066]",
  },
};

export function ShowcaseFilterBar({
  products,
  categories,
  activeTab,
  selectedCategorySlug,
  onTabSelect,
  onCategorySelect,
}: ShowcaseFilterBarProps) {
  const displayCategories = categories.filter(
    (c) => c.slug !== "home-cleaning" && !c.slug.includes("cleaning")
  );
  const bestSellerCount = products.filter((p) => p.isBestSeller).length;
  const newArrivalCount = products.filter((p) => p.isNewArrival).length;

  const tabs: { id: ShowcaseTab; label: string; count: number; icon: typeof ShoppingBag }[] =
    [
      { id: "all", label: HOME_COPY.allProducts, count: products.length, icon: ShoppingBag },
      { id: "bestsellers", label: HOME_COPY.bestSellers, count: bestSellerCount, icon: Star },
      { id: "newarrivals", label: HOME_COPY.newArrivals, count: newArrivalCount, icon: Sparkles },
    ];

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-center gap-2 md:gap-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const styles = TAB_STYLES[tab.id];
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabSelect(tab.id)}
              className={cn(
                "flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold shadow-2xs transition-all duration-200",
                isActive ? styles.active : styles.idle,
              )}
            >
              <Icon className={cn("h-4 w-4", tab.id === "bestsellers" && "fill-current")} />
              <span>{tab.label}</span>
              {(tab.id === "all" || tab.count > 0) && (
                <Badge
                  className={cn(
                    "ml-1 px-1.5 text-[11px]",
                    isActive ? styles.badgeActive : styles.badgeIdle,
                  )}
                >
                  {tab.count}
                </Badge>
              )}
            </button>
          );
        })}
      </div>

      {displayCategories.length > 0 ? (
        <div className="-mx-5 mb-8 flex items-center gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0">
          <button
            type="button"
            onClick={() => onCategorySelect(FILTER_ALL)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all",
              selectedCategorySlug === FILTER_ALL
                ? "border-primary bg-primary-soft font-bold text-primary shadow-xs"
                : "border-border/60 bg-card/80 text-muted hover:border-border hover:text-dark",
            )}
          >
            <span>{HOME_COPY.allCategories}</span>
            <span className="text-[10px] opacity-75">({products.length})</span>
          </button>
          {displayCategories.map((cat) => {
            const count = products.filter((p) =>
              matchesProductCategory(p, cat.slug, displayCategories),
            ).length;
            const isSelected =
              selectedCategorySlug.toLowerCase() === cat.slug.toLowerCase();
            return (
              <button
                key={cat._id}
                type="button"
                onClick={() => onCategorySelect(cat.slug)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all",
                  isSelected
                    ? "border-primary bg-primary-soft font-bold text-primary shadow-xs"
                    : "border-border/60 bg-card/80 text-muted hover:border-border hover:text-dark",
                )}
              >
                <span>{cat.name}</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 text-[10px] font-medium",
                    isSelected
                      ? "bg-primary/20 text-primary"
                      : "bg-muted/15 text-muted-foreground",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </>
  );
}
