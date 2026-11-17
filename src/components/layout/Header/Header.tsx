"use client";

import Link from "next/link";
import { Menu, ShoppingBag, LogOut, Shield } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { AnnouncementBar } from "@/components/layout/Header/AnnouncementBar";
import { HeaderCategoriesDropdown } from "@/components/layout/Header/HeaderCategoriesDropdown";
import { BrandLogo } from "@/components/common/BrandLogo";
import { CartDrawer } from "@/components/features/cart/CartDrawer";
import { ProfileDropdown } from "@/components/features/profile/ProfileDropdown";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { API_ENDPOINTS } from "@/constants/api";
import { CATALOG_COPY } from "@/constants/catalog";
import { LAYOUT } from "@/constants/layout";
import { NAV_LINKS } from "@/constants/ui";
import { ROUTES } from "@/constants/routes";
import { useCartStore } from "@/hooks/useCartStore";
import { SocialLinks } from "@/components/common/SocialLinks";
import { cn } from "@/lib/utils/cn";

import type { Category } from "@/types/product";

export function Header({ categories }: { categories: Category[] }) {
  const activeCategories = categories.filter(
    (c) => c.slug !== "home-cleaning" && !c.name.toLowerCase().includes("cleaning"),
  );
  const { data: session } = useSession();
  const itemCount = useCartStore((s) => s.getItemCount());
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menus, setMenus] = useState({ hasOffers: true, hasCombos: true });

  useEffect(() => {
    void fetch(API_ENDPOINTS.CATALOG_HIGHLIGHTS)
      .then((res) => res.json())
      .then((json) => {
        if (json.data) setMenus(json.data);
      })
      .catch(() => undefined);
  }, []);

  const extraLinks: { label: string; href: string }[] = [];
  if (menus.hasOffers) {
    extraLinks.push({ label: CATALOG_COPY.offersNav, href: ROUTES.OFFERS });
  }
  if (menus.hasCombos) {
    extraLinks.push({ label: CATALOG_COPY.combosNav, href: ROUTES.COMBOS });
  }

  const isAdmin = session?.user?.role === "admin";

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 shadow-[0_1px_3px_rgba(48,53,43,0.03)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/85">
      <AnnouncementBar />
      <PageContainer className="flex items-center justify-between gap-4 py-2.5 md:py-3.5">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-dark transition hover:border-primary/40 hover:bg-primary-soft hover:text-primary md:hidden"
          aria-label="Open menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          <Menu className="h-5 w-5" />
        </button>

        <BrandLogo variant="default" size="header" priority />

        {/* Main Desktop Navigation */}
        <nav className="hidden items-center gap-1 rounded-full border border-border/80 bg-card/85 px-2.5 py-1.5 shadow-[var(--shadow-soft)] md:flex lg:gap-2">
          <HeaderCategoriesDropdown categories={activeCategories} />
          {[...extraLinks, ...NAV_LINKS].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-1.5 text-[13px] font-semibold text-dark/85 transition-colors hover:bg-primary-soft hover:text-primary lg:px-3.5 lg:text-sm"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions (Profile Dropdown & Cart) */}
        <div className="flex items-center gap-2.5">
          <ProfileDropdown />

          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-full border border-border bg-card transition hover:border-primary/40 hover:bg-primary-soft hover:text-primary"
            aria-label="Open cart"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingBag className="h-5 w-5 text-dark" />
            {itemCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground ring-2 ring-background">
                {itemCount}
              </span>
            ) : null}
          </Button>
        </div>
      </PageContainer>

      {/* Mobile Drawer Menu */}
      <div
        className={cn(
          "max-h-[85vh] overflow-y-auto border-t border-border bg-background py-5 shadow-lg md:hidden",
          LAYOUT.container,
          mobileOpen ? "block" : "hidden",
        )}
      >
        <nav className="flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div onClick={() => setMobileOpen(false)}>
              <BrandLogo variant="default" size="sm" />
            </div>
            <span className="text-xs font-semibold text-[#4F8A45] bg-[#DDECCF]/60 px-2.5 py-1 rounded-full">
              Goodness, Naturally.
            </span>
          </div>

          <div className="space-y-1">
            <p className="eyebrow mb-2">
              Categories
            </p>
            <div className="grid grid-cols-2 gap-2">
              {activeCategories.map((cat) => (
                <Link
                  key={cat._id}
                  href={ROUTES.CATEGORY(cat.slug)}
                  className="rounded-2xl border border-border/80 bg-white px-3.5 py-2.5 text-xs font-bold text-[#263D2E] shadow-2xs transition hover:border-[#4F8A45]/40 hover:bg-[#DDECCF]/30 hover:text-[#4F8A45]"
                  onClick={() => setMobileOpen(false)}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-3 border-t border-border pt-3">
            {[...extraLinks, ...NAV_LINKS].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-xl px-3 py-2 text-sm font-semibold text-[#29352B] transition hover:bg-[#DDECCF]/40 hover:text-[#4F8A45]"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {session?.user ? (
            <div className="mt-2 pt-3 border-t border-border space-y-2.5">
              <p className="eyebrow">
                Account & Navigation ({isAdmin ? "Admin" : "User"})
              </p>

              {isAdmin && (
                <Link
                  href={ROUTES.ADMIN.DASHBOARD}
                  className="flex items-center gap-2 rounded-2xl border border-[#FFD45A]/50 bg-[#FFF0B8]/50 p-3 text-xs font-bold text-[#263D2E] transition hover:bg-[#FFD45A]/30"
                  onClick={() => setMobileOpen(false)}
                >
                  <Shield className="h-4 w-4 text-[#263D2E]" /> Go to Admin Dashboard
                </Link>
              )}

              <Link
                href={`${ROUTES.PROFILE}?tab=account`}
                className="block rounded-xl px-3 py-2 text-sm font-medium text-[#29352B] transition hover:bg-[#DDECCF]/40 hover:text-[#4F8A45]"
                onClick={() => setMobileOpen(false)}
              >
                Profile Maintain
              </Link>
              <Link
                href={`${ROUTES.PROFILE}?tab=addresses`}
                className="block rounded-xl px-3 py-2 text-sm font-medium text-[#29352B] transition hover:bg-[#DDECCF]/40 hover:text-[#4F8A45]"
                onClick={() => setMobileOpen(false)}
              >
                Saved Addresses
              </Link>
              <Link
                href={`${ROUTES.PROFILE}?tab=orders`}
                className="block rounded-xl px-3 py-2 text-sm font-medium text-[#29352B] transition hover:bg-[#DDECCF]/40 hover:text-[#4F8A45]"
                onClick={() => setMobileOpen(false)}
              >
                My Orders
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  signOut({ callbackUrl: ROUTES.HOME });
                }}
                className="flex items-center gap-2 text-sm font-bold text-destructive py-2 px-3"
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </div>
          ) : (
            <div className="mt-2 pt-3 border-t border-border flex gap-3">
              <Link
                href={ROUTES.LOGIN}
                className="flex-1 rounded-full bg-[#4F8A45] py-2.5 text-center text-sm font-bold text-white shadow-sm transition hover:bg-[#263D2E]"
                onClick={() => setMobileOpen(false)}
              >
                Login
              </Link>
              <Link
                href={ROUTES.REGISTER}
                className="flex-1 rounded-full border border-border bg-white py-2.5 text-center text-sm font-bold text-[#263D2E] transition hover:border-[#4F8A45]/40 hover:bg-[#DDECCF]/30"
                onClick={() => setMobileOpen(false)}
              >
                Register
              </Link>
            </div>
          )}

          {/* Mobile Social Links Strip */}
          <div className="mt-3 pt-3 border-t border-border">
            <p className="eyebrow mb-2">
              Connect on Social Media
            </p>
            <SocialLinks variant="pill" className="gap-2" />
          </div>
        </nav>
      </div>

      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
    </header>
  );
}