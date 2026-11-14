import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/PageContainer";
import { SocialLinks } from "@/components/common/SocialLinks";
import { LAYOUT } from "@/constants/layout";
import { UI } from "@/constants/ui";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "About Us",
  description:
    "Learn how Healargo brings together thoughtfully sourced products for everyday natural wellness.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <PageContainer className="py-12">
      <div className={LAYOUT.narrow}>
        <h1 className="font-display text-4xl text-dark">About {UI.brand}</h1>
        <p className="mt-4 text-lg text-muted">{UI.since}</p>
        <div className="mt-8 space-y-4 leading-relaxed text-dark/80">
          <p>
            {UI.brand} is built around a simple idea: everyday wellness should
            feel honest, approachable, and rooted in natural choices.
          </p>
          <p>
            We focus on carefully selected products, clear information, and a
            calm shopping experience that helps customers choose with confidence.
          </p>
          <p>
            From pantry staples to wellness essentials, our goal is to make
            thoughtful living easier through products you can trust and support
            that stays personal.
          </p>
        </div>

        <div className="mt-12 rounded-2xl border border-border bg-cream/60 p-6 sm:p-8">
          <h2 className="font-display text-xl font-bold text-dark sm:text-2xl">
            Stay Connected
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-muted sm:text-sm">
            Follow {UI.brand} across our official channels for product highlights,
            updates, and everyday wellness inspiration:
          </p>
          <div className="mt-5">
            <SocialLinks variant="pill" className="gap-2.5" />
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
