import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BrandLogo } from "@/components/common/BrandLogo";
import { AUTH_COPY, AUTH_HIGHLIGHTS } from "@/constants/auth";
import { LAYOUT } from "@/constants/layout";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils/cn";

export function AuthMobileBar() {
  return (
    <div className={cn(LAYOUT.container, "flex items-center justify-between border-b border-border bg-card/80 py-2.5 backdrop-blur lg:hidden")}>
      <BrandLogo variant="default" size="md" />
      <Link
        href={ROUTES.HOME}
        className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm font-medium text-muted transition hover:border-primary/30 hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        {AUTH_COPY.backToStore}
      </Link>
    </div>
  );
}

export function AuthBrandPanel() {
  return (
    <aside className="forest-gradient relative hidden overflow-hidden text-cream lg:flex lg:flex-col lg:justify-between lg:px-10 lg:py-8 xl:px-14">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full border border-accent/25"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-16 h-96 w-96 rounded-full border border-cream/10"
      />

      <div className="relative">
        <div className="flex items-center justify-between gap-4">
          <BrandLogo variant="light" size="xl" />
          <Link
            href={ROUTES.HOME}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3.5 py-1.5 text-sm font-medium text-cream/80 transition-colors hover:border-white/30 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            {AUTH_COPY.backToStore}
          </Link>
        </div>
        <p className="mt-10 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          {AUTH_COPY.panelEyebrow}
        </p>
        <h2 className="mt-3 max-w-md font-display text-4xl leading-tight text-white xl:text-5xl">
          {AUTH_COPY.panelHeadline}
        </h2>
        <p className="mt-4 max-w-sm text-base leading-relaxed text-cream/80">
          {AUTH_COPY.panelBody}
        </p>
      </div>

      <dl className="relative mt-10 grid grid-cols-3 gap-3">
        {AUTH_HIGHLIGHTS.map((item) => (
          <div key={item.label} className="rounded-2xl border border-cream/10 bg-white/[0.04] p-4 backdrop-blur-sm">
            <dt className="text-[11px] uppercase tracking-[0.14em] text-cream/65">
              {item.label}
            </dt>
            <dd className="mt-1.5 font-display text-xl text-accent">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
