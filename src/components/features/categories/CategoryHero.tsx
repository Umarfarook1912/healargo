"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Category } from "@/types/product";

interface CategoryHeroProps {
  category: Category;
  allCategories: Category[];
}

export function CategoryHero({ category, allCategories }: CategoryHeroProps) {
  return (
    <div className="herbal-gradient -mx-1 space-y-5 rounded-3xl border border-border/70 p-6 sm:p-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs font-medium text-muted">
        <Link href="/" className="hover:text-primary transition-colors">
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/shop" className="hover:text-primary transition-colors">
          Categories
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-dark font-semibold">{category.name}</span>
      </nav>

      <div>
        <p className="eyebrow">Collection</p>
        <h1 className="mt-2 font-display text-3xl leading-tight text-dark md:text-5xl">{category.name}</h1>
      </div>

      {/* Category Navigation Menu Bar */}
      {allCategories.length > 0 && (
        <div className="flex items-center flex-wrap gap-2 py-1">
          {allCategories.map((c) => {
            const isActive = c.slug.toLowerCase() === category.slug.toLowerCase();
            return (
              <Link
                key={c.slug}
                href={`/categories/${c.slug}`}
                className={cn(
                  "rounded-full border px-4 py-2 text-xs font-semibold transition-all",
                  isActive
                    ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "border-border bg-card text-dark hover:border-primary/40 hover:bg-primary-soft hover:text-primary",
                )}
              >
                {c.name}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
