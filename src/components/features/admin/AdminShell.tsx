"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ExternalLink, LogOut, Menu, X } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { ADMIN_COPY, ADMIN_NAV } from "@/constants/admin";
import { ASSETS } from "@/constants/assets";
import { LAYOUT } from "@/constants/layout";
import { ROUTES } from "@/constants/routes";
import { getPostLogoutRoute } from "@/lib/auth/post-login";
import { cn } from "@/lib/utils/cn";

function SidebarNav({
  pathname,
  onNavigate,
  className,
}: {
  pathname: string;
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <nav className={cn("space-y-1.5", className)}>
      {ADMIN_NAV.map(({ href, label, description, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all",
              active
                ? "bg-cream/10 text-white shadow-[inset_0_0_0_1px_rgba(201,162,70,0.35)]"
                : "text-cream/75 hover:bg-cream/[0.07] hover:text-white",
            )}
          >
            <span
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                active
                  ? "bg-accent text-accent-foreground shadow-sm shadow-black/20"
                  : "bg-cream/[0.06] text-cream/80 group-hover:bg-cream/10 group-hover:text-white",
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{label}</span>
              <span
                className={cn(
                  "block truncate text-[11px]",
                  active ? "text-cream/75" : "text-cream/55",
                )}
              >
                {description}
              </span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const page = ADMIN_NAV.find((item) => pathname.startsWith(item.href));

  return (
    <div className="min-h-screen bg-background lg:h-screen lg:overflow-hidden">
      <div className="flex min-h-screen w-full lg:h-full">
        {/* Fixed Desktop Sidebar */}
        <aside className="forest-gradient hidden w-72 shrink-0 flex-col border-r border-black/10 p-5 text-cream lg:flex lg:h-full lg:overflow-hidden">
          {/* Top Brand & Logo (Fixed) */}
          <Link
            href={ROUTES.ADMIN.DASHBOARD}
            className="flex shrink-0 flex-col items-center text-center group"
            aria-label="Admin Dashboard"
          >
            <div className="overflow-hidden rounded-2xl border border-white/20 bg-white p-2.5 shadow-lg shadow-black/20 transition-transform duration-300 group-hover:scale-105">
              <Image
                src={ASSETS.LOGO}
                alt={ADMIN_COPY.brand}
                width={120}
                height={110}
                unoptimized
                className="h-16 w-auto object-contain"
              />
            </div>
            <p className="mt-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
              {ADMIN_COPY.panelLabel}
            </p>
          </Link>

          {/* Middle Nav Items (Scrollable with Sleek Scrollbar) */}
          <div className="my-5 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1.5 custom-scrollbar">
            <SidebarNav pathname={pathname} />
          </div>

          {/* Bottom Actions (Pinned / Fixed) */}
          <div className="shrink-0 space-y-2 border-t border-cream/10 pt-4">
            <Link
              href={ROUTES.HOME}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-cream/75 transition hover:bg-cream/10 hover:text-white"
            >
              <ExternalLink className="h-4 w-4 shrink-0" />
              <span>{ADMIN_COPY.storefront}</span>
            </Link>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: getPostLogoutRoute() })}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-cream/75 transition hover:bg-cream/10 hover:text-white"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>{ADMIN_COPY.signOut}</span>
            </button>
          </div>
        </aside>

        {/* Mobile Slide-over Navigation Drawer */}
        {open ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-dark/60 backdrop-blur-xs transition-opacity"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            />
            <aside className="forest-gradient absolute left-0 top-0 flex h-full w-72 flex-col p-5 text-cream shadow-2xl animate-in slide-in-from-left duration-200">
              <div className="flex shrink-0 items-center justify-between pb-3 border-b border-cream/10">
                <Link
                  href={ROUTES.ADMIN.DASHBOARD}
                  className="flex items-center gap-3"
                  onClick={() => setOpen(false)}
                >
                  <div className="overflow-hidden rounded-xl bg-white p-1.5 shadow-xs border border-white/20">
                    <Image
                      src={ASSETS.LOGO}
                      alt={ADMIN_COPY.brand}
                      width={60}
                      height={55}
                      unoptimized
                      className="h-12 w-auto object-contain"
                    />
                  </div>
                  <p className="text-xs uppercase tracking-[0.18em] text-accent font-semibold">
                    {ADMIN_COPY.panelLabel}
                  </p>
                </Link>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-1 text-cream/70 hover:bg-cream/10 hover:text-cream transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Scrollable Nav on Mobile Drawer */}
              <div className="my-4 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1.5 custom-scrollbar">
                <SidebarNav pathname={pathname} onNavigate={() => setOpen(false)} />
              </div>

              {/* Bottom Actions on Mobile Drawer */}
              <div className="shrink-0 space-y-2 border-t border-cream/10 pt-4">
                <Link
                  href={ROUTES.HOME}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-cream/75 transition hover:bg-cream/10 hover:text-white"
                >
                  <ExternalLink className="h-4 w-4 shrink-0" />
                  <span>{ADMIN_COPY.storefront}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: getPostLogoutRoute() })}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-cream/75 transition hover:bg-cream/10 hover:text-white"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  <span>{ADMIN_COPY.signOut}</span>
                </button>
              </div>
            </aside>
          </div>
        ) : null}

        {/* Right Side Content Panel (Fixed layout & header, independent scroll container) */}
        <div className="flex min-w-0 flex-1 flex-col lg:h-full lg:min-h-0 lg:overflow-y-auto overscroll-contain">
          <header className={cn("sticky top-0 z-30 border-b border-border/80 bg-background/85 py-3.5 backdrop-blur-xl", LAYOUT.container)}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="rounded-xl border border-border bg-card p-2 transition hover:border-primary/30 hover:bg-primary-soft lg:hidden"
                  aria-label="Open menu"
                  onClick={() => setOpen(true)}
                >
                  <Menu className="h-5 w-5 text-dark" />
                </button>
                <div>
                  <p className="eyebrow">
                    {page?.label ?? "Admin"}
                  </p>
                  <p className="text-sm font-medium text-dark">
                    {page?.description ?? "Manage your store"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-semibold text-dark">
                    {session?.user?.name ?? "Admin"}
                  </p>
                  <p className="text-xs text-muted">{session?.user?.email}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground shadow-sm ring-2 ring-accent/50 ring-offset-2 ring-offset-background">
                  {(session?.user?.name ?? "A").slice(0, 1).toUpperCase()}
                </div>
              </div>
            </div>
          </header>
          <div className="mx-auto w-full max-w-[1600px] flex-1">
            <main className={cn("py-6 md:py-10", LAYOUT.container)}>{children}</main>
          </div>
        </div>
      </div>
    </div>
  );
}
