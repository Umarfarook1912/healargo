import { Leaf, HeartHandshake, ShieldCheck, Truck } from "lucide-react";
import { Stagger, StaggerItem } from "@/components/shared/motion";
import { PageContainer } from "@/components/layout/PageContainer";

const FEATURES = [
  {
    icon: Leaf,
    title: "Natural Focus",
    description: "Products chosen for everyday wellness",
  },
  {
    icon: HeartHandshake,
    title: "Honest Support",
    description: "Help via email and WhatsApp",
  },
  {
    icon: ShieldCheck,
    title: "Quality First",
    description: "Carefully reviewed before listing",
  },
  {
    icon: Truck,
    title: "Pan-India Delivery",
    description: "Reliable shipping across India",
  },
] as const;

export function TrustStrip() {
  return (
    <section aria-label="Why shop with us" className="relative z-10">
      <PageContainer>
        <Stagger className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-border bg-border shadow-[var(--shadow-soft)] lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <StaggerItem key={title}>
              <div className="group flex h-full flex-col gap-3 bg-card p-5 transition-colors hover:bg-primary-soft/50 sm:flex-row sm:items-center sm:gap-4 sm:p-6">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm transition-transform group-hover:-rotate-6 sm:h-12 sm:w-12">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold text-dark">{title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted sm:text-sm">{description}</p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </PageContainer>
    </section>
  );
}
