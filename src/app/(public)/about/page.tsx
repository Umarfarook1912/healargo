import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { HeartHandshake, ShieldCheck, Sparkles, Sprout, ArrowRight } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHero } from "@/components/shared/PageHero";
import { SocialLinks } from "@/components/common/SocialLinks";
import { FloatingMascot } from "@/components/features/mascots/FloatingMascot";
import { ASSETS } from "@/constants/assets";
import { LAYOUT } from "@/constants/layout";
import { ROUTES } from "@/constants/routes";
import { UI } from "@/constants/ui";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Our Story",
  description:
    "Learn how HEALARGO brings thoughtfully sourced natural products, cold-pressed oils, and agro goodness for a better everyday.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="The HEALARGO Story"
        title="Goodness, Naturally."
        description="Thoughtfully sourced natural products that bring a little more goodness into your everyday life."
      />

      <PageContainer className="py-12 md:py-20">
        <div className={LAYOUT.narrow}>
          {/* Official Brand Seal & Identity */}
          <div className="mb-12 flex flex-col items-center justify-center text-center">
            <div className="relative inline-flex flex-col items-center justify-center rounded-3xl border border-[#4F8A45]/20 bg-gradient-to-b from-[#FFF8E9] via-[#DDECCF]/35 to-[#FFF8E9] p-8 shadow-[var(--shadow-lifted)] transition-all hover:border-[#4F8A45]/40 hover:shadow-xl">
              <div className="relative">
                <Image
                  src={ASSETS.LOGO}
                  alt="HEALARGO Official Brand Seal"
                  width={240}
                  height={164}
                  priority
                  className="h-28 w-auto object-contain drop-shadow-sm transition-transform duration-300 hover:scale-105"
                />
                <div className="absolute -top-3 -right-6 hidden sm:block">
                  <FloatingMascot mascot="leaf" size="xs" speechBubble="100% Pure!" />
                </div>
              </div>
              <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#4F8A45]/30 bg-white/90 px-4 py-1 text-xs font-bold uppercase tracking-widest text-[#263D2E] shadow-2xs">
                Goodness, Naturally.
              </span>
            </div>
          </div>

          {/* Main Story Narrative */}
          <div className="space-y-6 text-base leading-relaxed text-[#29352B]/90 sm:text-lg">
            <p className="font-display text-2xl font-bold text-[#263D2E] sm:text-3xl leading-snug">
              Everyday goodness starts with the choices we make.
            </p>
            <p>
              At <strong className="font-bold text-[#263D2E]">HEALARGO</strong>, our journey began with a clear commitment: to strip away the industrial shortcuts, artificial adulterants, and confusing marketing claims that dominate modern supermarket shelves.
            </p>
            <p>
              We focus on premium, cold-pressed edible oils and pure ghee—including cold-pressed sesame oil, virgin coconut oil, pure castor oil, and pure desi cow ghee—extracted with patient craftsmanship that preserves the vibrant aroma, golden clarity, and natural nourishment.
            </p>
            <p>
              As we grow, HEALARGO expands naturally into other agro-based essentials: raw floral honey, sun-dried dry fruits, traditional pulses, and unrefined natural foods. All bound by the same timeless standard: pure ingredients, transparent sourcing, and honest care.
            </p>
          </div>

          {/* Pillars Grid */}
          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: Sprout,
                title: "Naturally Sourced",
                body: "Direct relationships with dedicated farms and clean, non-GMO seed harvests.",
                color: "bg-[#DDECCF] text-[#4F8A45]",
              },
              {
                icon: ShieldCheck,
                title: "Quality Focused",
                body: "Zero chemical refining, bleach, or synthetic additives. What you see is pure goodness.",
                color: "bg-[#FFF0B8] text-[#263D2E]",
              },
              {
                icon: HeartHandshake,
                title: "Everyday Goodness",
                body: "Friendly personal support by WhatsApp & email, packed and shipped across India with care.",
                color: "bg-[#FFE0D4] text-[#FF8066]",
              },
            ].map(({ icon: Icon, title, body, color }) => (
              <div
                key={title}
                className="surface-card flex flex-col justify-between p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#4F8A45]/30"
              >
                <div>
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl ${color} shadow-xs`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-bold text-[#263D2E]">
                    {title}
                  </h3>
                  <p className="mt-1.5 text-xs text-[#72776A] leading-relaxed">
                    {body}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Categories Vision Card */}
          <div className="relative mt-12 overflow-hidden rounded-3xl border border-[#263D2E]/10 bg-[#FFF0B8] p-7 shadow-[var(--shadow-soft)] sm:p-10">
            <div className="absolute right-4 bottom-3 hidden sm:block">
              <FloatingMascot mascot="coconut" size="sm" speechBubble="Cold-pressed pure!" />
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#263D2E]">
              <Sparkles className="h-3.5 w-3.5 text-[#4F8A45]" />
              Our Growing Range
            </span>
            <h2 className="mt-4 font-display text-2xl font-bold text-[#263D2E] sm:text-3xl">
              From Edible Oils to Wholesome Agro Goodness
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#72776A] sm:text-base">
              While our cornerstone remains cold-pressed Sesame, Coconut, and Castor oils alongside authentic pure Cow Ghee, we are thoughtfully bringing nature closer to your kitchen with upcoming releases in natural wellness essentials.
            </p>
            <div className="mt-6">
              <Link
                href={ROUTES.SHOP}
                className="inline-flex items-center gap-2 rounded-full bg-[#42513B] px-6 py-2.5 text-sm font-bold text-[#FFFEFA] shadow-sm transition hover:bg-[#30352B]"
              >
                <span>Explore Products</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Connect Band */}
          <div className="forest-gradient mt-12 rounded-3xl p-7 text-[#F8EBDD] shadow-[var(--shadow-lifted)] sm:p-10">
            <h2 className="font-display text-2xl font-bold text-[#FFFEFA] sm:text-3xl">
              Stay Connected With {UI.brand}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#F8EBDD]/80">
              Follow {UI.brand} across our official channels for product stories, recipe ideas, and behind-the-scenes sourcing journeys:
            </p>
            <div className="mt-5">
              <SocialLinks variant="pill" className="gap-2.5" />
            </div>
          </div>
        </div>
      </PageContainer>
    </>
  );
}
