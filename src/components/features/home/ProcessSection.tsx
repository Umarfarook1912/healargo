import {
  FadeIn,
  Stagger,
  StaggerItem,
} from "@/components/shared/motion";
import { PageContainer } from "@/components/layout/PageContainer";

const STEPS = [
  {
    step: "01",
    title: "Curate",
    body: "We shortlist natural products that meet our standards for quality, clarity, and everyday use.",
  },
  {
    step: "02",
    title: "Verify",
    body: "Each offering is reviewed for sourcing integrity, labeling clarity, and customer usefulness.",
  },
  {
    step: "03",
    title: "Prepare",
    body: "Orders are packed with care so products arrive fresh, intact, and ready to enjoy.",
  },
  {
    step: "04",
    title: "Support",
    body: "From first question to delivery updates, our team stays reachable by email and WhatsApp.",
  },
] as const;

export function ProcessSection() {
  return (
    <section className="bg-primary/5 py-16">
      <PageContainer>
        <FadeIn>
          <p className="text-sm font-medium uppercase tracking-wide text-primary">
            Our Approach
          </p>
          <h2 className="mt-2 max-w-xl font-display text-3xl text-dark md:text-4xl">
            From Selection to Your Doorstep
          </h2>
        </FadeIn>
        <Stagger className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4" delay={0.1}>
          {STEPS.map((item) => (
            <StaggerItem key={item.step}>
              <div className="rounded-lg bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
                <p className="font-display text-3xl text-accent">{item.step}</p>
                <h3 className="mt-3 font-display text-xl">{item.title}</h3>
                <p className="mt-2 text-sm text-muted">{item.body}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </PageContainer>
    </section>
  );
}
