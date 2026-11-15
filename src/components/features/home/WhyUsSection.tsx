import Link from "next/link";
import { ArrowRight, BadgeCheck, Gem, Sprout, Truck } from "lucide-react";
import {
  FadeIn,
  Stagger,
  StaggerItem,
} from "@/components/shared/motion";
import { PageContainer } from "@/components/layout/PageContainer";
import { ROUTES } from "@/constants/routes";
import { UI } from "@/constants/ui";

const FEATURES = [
  {
    icon: Sprout,
    title: "Thoughtfully Sourced",
    body: "We select ingredients and products with care — prioritizing purity, transparency, and everyday usefulness.",
  },
  {
    icon: BadgeCheck,
    title: "Honest Formulation",
    body: "No unnecessary fillers or confusing claims. Clear products made for real routines.",
  },
  {
    icon: Gem,
    title: "Quality You Can Feel",
    body: "From aroma to texture, we focus on sensory quality that makes natural choices feel premium.",
  },
  {
    icon: Truck,
    title: "Direct to Your Door",
    body: "Shop online with personal support by email or WhatsApp, and delivery across India.",
  },
] as const;

export function WhyUsSection() {
  return (
    <section className="forest-gradient relative isolate overflow-hidden py-20 text-cream md:py-28">
      <span aria-hidden className="pointer-events-none absolute -left-40 top-1/2 -z-10 h-[32rem] w-[32rem] -translate-y-1/2 rounded-full border border-cream/[0.07]" />
      <span aria-hidden className="pointer-events-none absolute -left-24 top-1/2 -z-10 h-[22rem] w-[22rem] -translate-y-1/2 rounded-full border border-accent/15" />
      <PageContainer className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <FadeIn className="lg:sticky lg:top-28 lg:self-start">
          <p className="eyebrow text-accent">
            <span aria-hidden className="h-px w-6 bg-accent/70" />
            Why {UI.brand}
          </p>
          <h2 className="mt-4 font-display text-4xl leading-[1.08] text-white sm:text-5xl lg:text-6xl">
            Natural Wellness, <span className="italic text-accent">Made Simple</span>
          </h2>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-cream/80 sm:text-lg">
            {UI.brand} brings carefully chosen natural products into a calm,
            trustworthy shopping experience — so everyday wellness feels easier.
          </p>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold">
            <Link href={ROUTES.ABOUT} className="group inline-flex items-center gap-2 text-white">
              <span className="border-b border-accent/60 pb-0.5 transition-colors group-hover:border-accent">Our story</span>
              <ArrowRight className="h-4 w-4 text-accent transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link href={ROUTES.CERTIFICATES} className="group inline-flex items-center gap-2 text-white">
              <span className="border-b border-accent/60 pb-0.5 transition-colors group-hover:border-accent">Certificates</span>
              <ArrowRight className="h-4 w-4 text-accent transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </FadeIn>

        <Stagger className="grid gap-4 sm:grid-cols-2 sm:gap-5" delay={0.1}>
          {FEATURES.map(({ icon: Icon, title, body }, index) => (
            <StaggerItem key={title} className={index % 2 === 1 ? "sm:translate-y-10" : undefined}>
              <div className="group h-full rounded-3xl border border-cream/10 bg-white/[0.045] p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-accent/50 hover:bg-white/[0.08] sm:p-7">
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground shadow-lg shadow-black/20 transition-transform group-hover:-rotate-6">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span aria-hidden className="font-display text-3xl text-cream/15">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-6 font-display text-xl text-white sm:text-2xl">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-cream/75">{body}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </PageContainer>
    </section>
  );
}
