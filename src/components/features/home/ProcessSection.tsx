import { ClipboardCheck, Headset, PackageCheck, Search } from "lucide-react";
import {
  Stagger,
  StaggerItem,
} from "@/components/shared/motion";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionHeading } from "@/components/features/home/SectionHeading";

const STEPS = [
  {
    step: "01",
    icon: Search,
    title: "Curate",
    body: "We shortlist natural products that meet our standards for quality, clarity, and everyday use.",
  },
  {
    step: "02",
    icon: ClipboardCheck,
    title: "Verify",
    body: "Each offering is reviewed for sourcing integrity, labeling clarity, and customer usefulness.",
  },
  {
    step: "03",
    icon: PackageCheck,
    title: "Prepare",
    body: "Orders are packed with care so products arrive fresh, intact, and ready to enjoy.",
  },
  {
    step: "04",
    icon: Headset,
    title: "Support",
    body: "From first question to delivery updates, our team stays reachable by email and WhatsApp.",
  },
] as const;

export function ProcessSection() {
  return (
    <section className="herbal-gradient relative py-16 md:py-24">
      <PageContainer>
        <SectionHeading
          align="center"
          eyebrow="Our Approach"
          title="From Selection to Your Doorstep"
        />
        <div className="relative">
          <span
            aria-hidden
            className="pointer-events-none absolute left-[12.5%] right-[12.5%] top-8 hidden h-px border-t border-dashed border-primary/30 lg:block"
          />
          <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8" delay={0.1}>
            {STEPS.map(({ step, icon: Icon, title, body }) => (
              <StaggerItem key={step}>
                <div className="group relative flex h-full flex-col items-center text-center">
                  <span className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full border-4 border-background bg-primary text-primary-foreground shadow-[var(--shadow-lifted)] transition-transform duration-300 group-hover:scale-105">
                    <Icon className="h-6 w-6" />
                    <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground ring-2 ring-background">
                      {step}
                    </span>
                  </span>
                  <div className="surface-card mt-5 w-full flex-1 p-6 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[var(--shadow-lifted)]">
                    <h3 className="font-display text-xl text-dark">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </PageContainer>
    </section>
  );
}
