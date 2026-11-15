import type { Metadata } from "next";
import { Leaf, HeartHandshake, ShieldCheck } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHero } from "@/components/shared/PageHero";
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
    <>
    <PageHero eyebrow="Our story" title={`About ${UI.brand}`} description={UI.since} />
    <PageContainer className="py-12 md:py-16">
      <div className={LAYOUT.narrow}>
        <div className="space-y-5 text-lg leading-relaxed text-dark/85">
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

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {[
            { icon: Leaf, title: "Natural choices", body: "Products selected for everyday wellness." },
            { icon: ShieldCheck, title: "Clear information", body: "Honest details so you can choose with confidence." },
            { icon: HeartHandshake, title: "Personal support", body: "Real help by email and WhatsApp." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="surface-card p-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted">{body}</p>
            </div>
          ))}
        </div>

        <div className="forest-gradient mt-12 rounded-3xl p-7 text-cream shadow-[var(--shadow-lifted)] sm:p-10">
          <h2 className="font-display text-2xl text-white sm:text-3xl">
            Stay Connected
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-cream/80">
            Follow {UI.brand} across our official channels for product highlights,
            updates, and everyday wellness inspiration:
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
