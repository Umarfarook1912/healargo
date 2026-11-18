"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import {
  Candy,
  ChevronDown,
  Citrus,
  Droplet,
  Flame,
  Leaf,
  Nut,
  Sparkles,
  Wheat,
  type LucideIcon,
} from "lucide-react";
import { ROUTES } from "@/constants/routes";
import type { Category } from "@/types/product";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "cold-pressed-oils": Droplet,
  "wood-pressed-oils": Droplet,
  "sesame-oil": Droplet,
  "coconut-oil": Citrus,
  "pure-cow-ghee": Sparkles,
  "castor-oil": Droplet,
};

function categoryMenuLabel(name: string) {
  const open = name.lastIndexOf("(");
  const close = name.lastIndexOf(")");
  if (open > 0 && close > open) {
    return {
      title: name.slice(0, open).trim(),
      subtitle: name.slice(open + 1, close).trim(),
    };
  }
  return { title: name, subtitle: "" };
}

export function HeaderCategoriesDropdown({
  categories,
}: {
  categories: Category[];
}) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setOpen(false);
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[13px] font-medium text-dark/80 transition-colors hover:bg-primary-soft hover:text-primary lg:px-3 lg:text-sm"
        aria-expanded={open}
      >
        <span>Categories</span>
        <ChevronDown
          className={`h-4 w-4 text-muted transition-transform duration-200 ${
            open ? "rotate-180 text-primary" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-3 max-h-[min(70vh,32rem)] w-[38rem] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-3xl border border-border bg-card p-4 shadow-[var(--shadow-lifted)] animate-in fade-in-0 slide-in-from-top-1">
          <div className="eyebrow mb-3 px-2.5 pt-1">
            Shop By Category
          </div>

          <div className="grid grid-cols-2 gap-1">
            {categories.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.slug] ?? Droplet;
              const label = categoryMenuLabel(cat.name);
              return (
                <Link
                  key={cat._id}
                  href={ROUTES.CATEGORY(cat.slug)}
                  onClick={() => setOpen(false)}
                  className="group flex items-center gap-2.5 rounded-xl p-2.5 transition-colors hover:bg-primary-soft"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary ring-1 ring-primary/10 transition group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-2 text-sm font-semibold leading-snug text-dark group-hover:text-primary">
                      {label.title}
                    </div>
                    <div className="truncate text-xs text-muted">
                      {label.subtitle || cat.badge}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="mt-3 border-t border-border pt-3 text-center">
            <Link
              href={ROUTES.SHOP}
              onClick={() => setOpen(false)}
              className="inline-flex items-center rounded-full px-4 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary-soft"
            >
              View All Products &rarr;
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
