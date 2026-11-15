import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { FadeIn, Stagger, StaggerItem } from "@/components/shared/motion";
import { PageContainer } from "@/components/layout/PageContainer";
import { WhatsAppLogo } from "@/components/common/SocialLinks";
import { FAQS } from "@/constants/faqs";
import { ROUTES } from "@/constants/routes";
import { UI } from "@/constants/ui";
import { buildWhatsAppUrl } from "@/lib/utils/whatsapp";

/** Short FAQ preview using the existing FAQ constants (video answers stay on /faqs). */
const PREVIEW_FAQS = FAQS.filter((faq) => faq.category !== "videos").slice(0, 5);

export function HomeFaqTeaser() {
  if (!PREVIEW_FAQS.length) return null;

  return (
    <section className="py-16 md:py-24">
      <PageContainer className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <FadeIn className="lg:sticky lg:top-28 lg:self-start">
          <p className="eyebrow">
            <span aria-hidden className="h-px w-6 bg-accent-strong/60" />
            FAQs
          </p>
          <h2 className="mt-3 font-display text-3xl leading-[1.12] text-dark sm:text-4xl lg:text-[3.25rem]">
            Questions, answered
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-muted">
            Quick answers about our products, delivery and payments. Can&apos;t find
            what you need? Message us on WhatsApp or email {UI.email}.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href={ROUTES.FAQS}
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-strong"
            >
              View all FAQs
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href={buildWhatsAppUrl(`Hi ${UI.brand}! I have a question.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-dark transition-colors hover:border-primary/40 hover:text-primary"
            >
              <WhatsAppLogo className="h-4 w-4 text-[#1a8f4c]" />
              Ask on WhatsApp
            </a>
          </div>
        </FadeIn>

        <Stagger className="flex flex-col gap-3" delay={0.05}>
          {PREVIEW_FAQS.map((faq) => (
            <StaggerItem key={faq.id}>
              <details className="group surface-card overflow-hidden transition-shadow open:shadow-[var(--shadow-lifted)]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-left font-semibold text-dark marker:hidden sm:p-6 [&::-webkit-details-marker]:hidden">
                  <span className="text-base leading-snug sm:text-lg">{faq.q}</span>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary transition-all group-open:rotate-45 group-open:bg-primary group-open:text-primary-foreground">
                    <Plus className="h-4 w-4" />
                  </span>
                </summary>
                <p className="-mt-1 px-5 pb-6 text-sm leading-relaxed text-muted sm:px-6">
                  {faq.a}
                </p>
              </details>
            </StaggerItem>
          ))}
        </Stagger>
      </PageContainer>
    </section>
  );
}
