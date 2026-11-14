import {
  FadeIn,
  Stagger,
  StaggerItem,
} from "@/components/shared/motion";
import { PageContainer } from "@/components/layout/PageContainer";
import { UI } from "@/constants/ui";

const FEATURES = [
  {
    title: "Thoughtfully Sourced",
    body: "We select ingredients and products with care — prioritizing purity, transparency, and everyday usefulness.",
  },
  {
    title: "Honest Formulation",
    body: "No unnecessary fillers or confusing claims. Clear products made for real routines.",
  },
  {
    title: "Quality You Can Feel",
    body: "From aroma to texture, we focus on sensory quality that makes natural choices feel premium.",
  },
  {
    title: "Direct to Your Door",
    body: "Shop online with personal support by email or WhatsApp, and delivery across India.",
  },
] as const;

export function WhyUsSection() {
  return (
    <section className="bg-dark py-16 text-cream">
      <PageContainer>
        <FadeIn>
          <p className="text-sm font-medium uppercase tracking-wide text-accent">
            Why {UI.brand}
          </p>
          <h2 className="mt-2 max-w-2xl font-display text-3xl text-cream md:text-4xl">
            Natural Wellness, Made Simple
          </h2>
          <p className="mt-4 max-w-2xl text-cream/70">
            {UI.brand} brings carefully chosen natural products into a calm,
            trustworthy shopping experience — so everyday wellness feels easier.
          </p>
        </FadeIn>
        <Stagger className="mt-10 grid w-full gap-6 md:grid-cols-2" delay={0.1}>
          {FEATURES.map((feature) => (
            <StaggerItem key={feature.title}>
              <div className="h-full rounded-lg border border-cream/10 p-5 transition-colors hover:border-accent/40">
                <h3 className="font-display text-xl text-accent">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-cream/70">{feature.body}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </PageContainer>
    </section>
  );
}
