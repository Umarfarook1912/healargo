import Link from "next/link";
import { ArrowUpRight, Clock, Mail, MapPin, Phone } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { FOOTER_POLICY_LINKS, NAV_LINKS, SOCIAL_LINKS, UI } from "@/constants/ui";
import { ROUTES } from "@/constants/routes";
import { SITE_TAGLINE } from "@/constants/seo";
import { SocialLinks, WhatsAppLogo } from "@/components/common/SocialLinks";
import { BrandLogo } from "@/components/common/BrandLogo";
import { FloatingMascot } from "@/components/features/mascots/FloatingMascot";
import { buildWhatsAppUrl } from "@/lib/utils/whatsapp";

const hasSocialLinks = SOCIAL_LINKS.some((link) => Boolean(link.href));

const SHOP_LINKS = [
  { label: "All Products", href: ROUTES.SHOP },
  { label: "Bestsellers", href: ROUTES.BESTSELLERS },
  { label: "Offers", href: ROUTES.OFFERS },
  { label: "Combos", href: ROUTES.COMBOS },
] as const;

const SHOP_HREFS: readonly string[] = [ROUTES.SHOP, ROUTES.BESTSELLERS];
const EXPLORE_LINKS = NAV_LINKS.filter((link) => !SHOP_HREFS.includes(link.href));

const linkClass =
  "group inline-flex items-center gap-1 text-[#FFF8E9]/80 transition-colors hover:text-[#FFD45A]";

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#FFD45A]">
      <span aria-hidden className="h-px w-4 bg-[#FFD45A]/60" />
      {children}
    </p>
  );
}

export function Footer() {
  return (
    <footer className="forest-gradient relative isolate mt-16 overflow-hidden text-[#FFF8E9] md:mt-24">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FFD45A]/60 to-transparent" />
      <span aria-hidden className="pointer-events-none absolute -right-32 -top-32 -z-10 h-96 w-96 rounded-full border border-[#FFD45A]/15" />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -bottom-[0.18em] -z-10 select-none text-center font-display text-[20vw] leading-none text-[#FFF8E9]/[0.035] lg:text-[15rem]"
      >
        {UI.brand}
      </span>

      {/* Brand + contact CTA row */}
      <PageContainer className="flex flex-col gap-8 border-b border-[#FFF8E9]/10 py-12 md:flex-row md:items-center md:justify-between md:py-14">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-7">
          <BrandLogo variant="light" size="footer" />
          <div className="max-w-md">
            <p className="font-display text-2xl leading-snug text-white sm:text-3xl">
              {SITE_TAGLINE}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[#FFF8E9]/75">{UI.since}</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <a
            href={buildWhatsAppUrl(`Hi ${UI.brand}! I want to explore your natural products.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#FFD45A] px-6 py-3 text-sm font-bold text-[#263D2E] shadow-lg shadow-black/20 transition-colors hover:bg-[#ffe17d]"
          >
            <WhatsAppLogo className="h-4 w-4" />
            Chat on WhatsApp
          </a>
          <a
            href={`mailto:${UI.email}`}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[#FFF8E9]/25 px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-[#FFD45A] hover:text-[#FFD45A]"
          >
            <Mail className="h-4 w-4" />
            Email us
          </a>
          <div className="hidden lg:block ml-2">
            <FloatingMascot mascot="leaf" size="xs" speechBubble="Stay natural!" />
          </div>
        </div>
      </PageContainer>

      {/* Link columns */}
      <PageContainer className="grid grid-cols-2 gap-x-6 gap-y-10 py-12 md:grid-cols-[1fr_1fr_1.4fr] md:py-14 lg:grid-cols-[1fr_1fr_1.3fr_1.1fr]">
        <nav aria-label="Shop">
          <FooterHeading>Shop</FooterHeading>
          <ul className="space-y-3 text-sm">
            {SHOP_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={linkClass}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Explore">
          <FooterHeading>Explore</FooterHeading>
          <ul className="space-y-3 text-sm">
            {EXPLORE_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={linkClass}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="col-span-2 md:col-span-1">
          <FooterHeading>Contact</FooterHeading>
          <ul className="space-y-3.5 text-sm text-cream/80">
            <li className="flex items-start gap-3">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <a href={`mailto:${UI.email}`} className="break-all transition-colors hover:text-accent">
                {UI.email}
              </a>
            </li>
            <li className="flex items-start gap-3">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <div className="flex flex-col gap-1">
                {UI.phones.map((phone) => (
                  <a
                    key={phone.digits}
                    href={`tel:${phone.tel}`}
                    className="transition-colors hover:text-accent"
                  >
                    {phone.display}
                  </a>
                ))}
              </div>
            </li>
            {UI.workingHours ? (
              <li className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span>{UI.workingHours}</span>
              </li>
            ) : null}
            {UI.address ? (
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span className="leading-relaxed">
                  {UI.address}
                  {UI.mapDirectionsUrl ? (
                    <a
                      href={UI.mapDirectionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 flex items-center gap-1 font-semibold text-accent hover:underline"
                    >
                      Get Directions
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  ) : null}
                </span>
              </li>
            ) : null}
          </ul>
        </div>

        <div className="col-span-2 md:col-span-3 lg:col-span-1">
          <FooterHeading>Follow & Connect</FooterHeading>
          <p className="text-sm leading-relaxed text-cream/75">
            Reach us at {UI.email} for orders, partnerships, and product questions.
          </p>
          {hasSocialLinks ? (
            <SocialLinks variant="footer" className="mt-5 flex-col items-start gap-2.5" />
          ) : null}
        </div>
      </PageContainer>

      {/* Bottom bar */}
      <div className="border-t border-cream/10 bg-black/15">
        <PageContainer className="flex flex-col items-center justify-between gap-4 py-5 text-xs text-cream/65 md:flex-row">
          <span className="text-center md:text-left">
            © {new Date().getFullYear()} {UI.brand}. All rights reserved.
          </span>
          <nav aria-label="Policies">
            <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              {FOOTER_POLICY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition-colors hover:text-accent">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          {hasSocialLinks ? (
            <SocialLinks variant="icons" iconClassName="h-3.5 w-3.5" className="gap-1.5" />
          ) : null}
        </PageContainer>
      </div>
    </footer>
  );
}
