import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#4F8A45]/30 bg-white/90 px-3.5 py-1 text-xs font-extrabold uppercase tracking-[0.16em] text-[#4F8A45] shadow-xs backdrop-blur">
            Frequently Asked Questions
          </div>
          <h2 className="mt-4 font-display text-3xl font-normal leading-[1.12] text-[#263D2E] sm:text-4xl lg:text-5xl">
            Questions,{" "}
            <span className="relative inline-block text-[#4F8A45]">
              <span className="italic font-normal">Answered</span>
              <svg
                aria-hidden
                viewBox="0 0 160 14"
                preserveAspectRatio="none"
                className="absolute -bottom-1 left-0 h-2.5 w-full text-[#FFD45A]"
              >
                <path
                  d="M 2 10 C 40 2, 120 3, 158 8 C 120 12, 50 13, 2 10 Z"
                  fill="currentColor"
                />
              </svg>
            </span>
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-[#72776A]">
            Quick answers about our cold-pressed oils, gentle extraction, and delivery across India. Need personal help? We&apos;re reachable on WhatsApp or email.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button
              size="lg"
              className="group gap-2 rounded-full bg-[#4F8A45] px-7 font-bold text-white shadow-sm transition hover:bg-[#263D2E]"
              asChild
            >
              <Link href={ROUTES.FAQS}>
                View all FAQs
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="gap-2 rounded-full border-[#263D2E]/20 bg-white px-6 font-semibold text-[#263D2E] hover:border-[#4F8A45] hover:bg-[#DDECCF]/40"
              asChild
            >
              <a
                href={buildWhatsAppUrl(`Hi ${UI.brand}! I have a question about your natural oils.`)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <WhatsAppLogo className="h-4 w-4" />
                Ask on WhatsApp
              </a>
            </Button>
          </div>
        </FadeIn>

        <Stagger className="flex flex-col gap-3.5" delay={0.05}>
          {PREVIEW_FAQS.map((faq) => (
            <StaggerItem key={faq.id}>
              <details className="group overflow-hidden rounded-2xl border border-border/70 bg-white shadow-[var(--shadow-soft)] transition-all open:border-[#4F8A45]/30 open:shadow-[var(--shadow-lifted)]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-left font-display text-base font-bold text-[#263D2E] marker:hidden sm:p-6 [&::-webkit-details-marker]:hidden">
                  <span className="leading-snug sm:text-lg">{faq.q}</span>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#DDECCF] text-[#4F8A45] transition-all group-open:rotate-45 group-open:bg-[#4F8A45] group-open:text-white">
                    <Plus className="h-4 w-4" />
                  </span>
                </summary>
                <div className="border-t border-border/50 px-5 pb-5 pt-3 text-xs leading-relaxed text-[#72776A] sm:px-6 sm:pb-6 sm:text-sm">
                  {faq.a}
                </div>
              </details>
            </StaggerItem>
          ))}
        </Stagger>
      </PageContainer>
    </section>
  );
}
