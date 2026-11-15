"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu, ShoppingBag, LogOut, Shield } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { AnnouncementBar } from "@/components/layout/Header/AnnouncementBar";
import { HeaderCategoriesDropdown } from "@/components/layout/Header/HeaderCategoriesDropdown";
import { CartDrawer } from "@/components/features/cart/CartDrawer";
import { ProfileDropdown } from "@/components/features/profile/ProfileDropdown";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { API_ENDPOINTS } from "@/constants/api";
import { CATALOG_COPY } from "@/constants/catalog";
import { ASSETS } from "@/constants/assets";
import { LAYOUT } from "@/constants/layout";
import { NAV_LINKS, UI } from "@/constants/ui";
import { ROUTES } from "@/constants/routes";
import { useCartStore } from "@/hooks/useCartStore";
import { SocialLinks } from "@/components/common/SocialLinks";
import { cn } from "@/lib/utils/cn";

import type { Category } from "@/types/product";

export function Header({ categories }: { categories: Category[] }) {
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
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 shadow-[0_1px_0_rgba(16,38,27,0.02)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/75">
      <AnnouncementBar />
      <PageContainer className="flex items-center justify-between gap-4 py-2.5 md:py-3">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-dark transition hover:border-primary/30 hover:text-primary md:hidden"
          aria-label="Open menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link
          href={ROUTES.HOME}
          className="flex items-center shrink-0 transition-opacity hover:opacity-90 py-0.5 group"
          aria-label={`${UI.brand} Home`}
        >
          <Image
            src={ASSETS.LOGO}
            alt={`${UI.brand} logo`}
            width={120}
            height={110}
            priority
            unoptimized
            className="h-11 w-auto object-contain transition-transform duration-300 group-hover:scale-105 sm:h-12 md:h-14"
          />
        </Link>

        {/* Main Desktop Navigation */}
        <nav className="hidden items-center gap-1 rounded-full border border-border/70 bg-card/70 px-2 py-1 shadow-[var(--shadow-soft)] md:flex lg:gap-1.5">
          <HeaderCategoriesDropdown categories={categories} />
          {[...extraLinks, ...NAV_LINKS].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-2.5 py-1.5 text-[13px] font-medium text-dark/80 transition-colors hover:bg-primary-soft hover:text-primary lg:px-3 lg:text-sm"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions (Profile Dropdown & Cart) */}
        <div className="flex items-center gap-2">
          <ProfileDropdown />

          <Button
            variant="ghost"
            size="icon"
            className="relative border border-border bg-card"
            aria-label="Open cart"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingBag className="h-5 w-5" />
            {itemCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold text-accent-foreground ring-2 ring-background">
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
          <div className="space-y-1">
            <p className="eyebrow mb-2">
              Categories
            </p>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => (
                <Link
                  key={cat._id}
                  href={ROUTES.CATEGORY(cat.slug)}
                  className="rounded-xl border border-border bg-card px-3 py-2.5 text-xs font-medium text-dark transition hover:border-primary/30 hover:bg-primary-soft hover:text-primary"
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
                className="block rounded-lg px-2 py-2 text-sm font-medium text-dark transition hover:bg-primary-soft hover:text-primary"
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
                  className="flex items-center gap-2 rounded-xl border border-accent/40 bg-accent-soft p-3 text-xs font-bold text-dark transition hover:bg-accent/25"
                  onClick={() => setMobileOpen(false)}
                >
                  <Shield className="h-4 w-4 text-accent-strong" /> Go to Admin Dashboard
                </Link>
              )}

              <Link
                href={`${ROUTES.PROFILE}?tab=account`}
                className="block rounded-lg px-2 py-1.5 text-sm font-medium text-dark transition hover:bg-primary-soft hover:text-primary"
                onClick={() => setMobileOpen(false)}
              >
                Profile Maintain
              </Link>
              <Link
                href={`${ROUTES.PROFILE}?tab=addresses`}
                className="block rounded-lg px-2 py-1.5 text-sm font-medium text-dark transition hover:bg-primary-soft hover:text-primary"
                onClick={() => setMobileOpen(false)}
              >
                Saved Addresses
              </Link>
              <Link
                href={`${ROUTES.PROFILE}?tab=orders`}
                className="block rounded-lg px-2 py-1.5 text-sm font-medium text-dark transition hover:bg-primary-soft hover:text-primary"
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
                className="flex items-center gap-2 text-sm font-semibold text-destructive py-2"
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </div>
          ) : (
            <div className="mt-2 pt-3 border-t border-border flex gap-3">
              <Link
                href={ROUTES.LOGIN}
                className="flex-1 rounded-full bg-primary py-2.5 text-center text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary-strong"
                onClick={() => setMobileOpen(false)}
              >
                Login
              </Link>
              <Link
                href={ROUTES.REGISTER}
                className="flex-1 rounded-full border border-input bg-card py-2.5 text-center text-sm font-semibold text-dark transition hover:bg-primary-soft"
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