"use client";

import { ClipboardCheck, Headset, PackageCheck, Search, Sparkles } from "lucide-react";
import { Stagger, StaggerItem } from "@/components/shared/motion";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionHeading } from "@/components/features/home/SectionHeading";

const STEPS = [
  {
    step: "01",
    icon: Search,
    color: "bg-[#D8F3EC] text-[#263D2E] border-[#8EDBD0]/60",
    badgeColor: "bg-[#8EDBD0] text-[#263D2E]",
    title: "Curate",
    body: "We select pure natural seeds and ingredients that meet our standards for purity, fresh aroma, and culinary usefulness.",
  },
  {
    step: "02",
    icon: ClipboardCheck,
    color: "bg-[#FFF0B8] text-[#263D2E] border-[#FFD45A]/70",
    badgeColor: "bg-[#FFD45A] text-[#263D2E]",
    title: "Cold-Press",
    body: "Extracted gently without excessive heat or chemical refining to keep natural nutrients, vitamins, and antioxidants intact.",
  },
  {
    step: "03",
    icon: PackageCheck,
    color: "bg-[#FFE0D4] text-[#263D2E] border-[#FF8066]/50",
    badgeColor: "bg-[#FF8066] text-white",
    title: "Carefully Pack",
    body: "Filled into protective containers and packed securely with eco-conscious padding so every bottle arrives safe and fresh.",
  },
  {
    step: "04",
    icon: Headset,
    color: "bg-[#DDECCF] text-[#263D2E] border-[#4F8A45]/40",
    badgeColor: "bg-[#4F8A45] text-white",
    title: "Always Reachable",
    body: "From first inquiry to doorstep delivery, our caring team is available via direct WhatsApp and email support.",
  },
] as const;

export function ProcessSection() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-20 md:py-28">
      {/* Playful background ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/3 top-0 -z-10 h-72 w-72 rounded-full bg-[#FFD45A]/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-10 bottom-0 -z-10 h-80 w-80 rounded-full bg-[#8EDBD0]/25 blur-3xl"
      />

      <PageContainer>
        <SectionHeading
          align="center"
          eyebrow={
            <span className="inline-flex items-center gap-1.5 font-extrabold text-[#4F8A45]">
              <Sparkles className="h-4 w-4 text-[#FFD45A]" />
              Our Honest Journey
            </span>
          }
          title="From Farm Selection to Your Kitchen"
          description="A transparent, unhurried cold-pressing approach that respects nature and elevates your cooking."
        />
        <div className="relative mt-12 md:mt-16">
          <span
            aria-hidden
            className="pointer-events-none absolute left-[12.5%] right-[12.5%] top-8 hidden h-px border-t-2 border-dashed border-[#4F8A45]/25 lg:block"
          />
          <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8" delay={0.1}>
            {STEPS.map(({ step, icon: Icon, color, badgeColor, title, body }) => (
              <StaggerItem key={step}>
                <div className="group relative flex h-full flex-col items-center text-center">
                  <span
                    className={`relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl border-2 ${color} shadow-sm transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3`}
                  >
                    <Icon className="h-6 w-6 text-[#263D2E]" />
                    <span
                      className={`absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full ${badgeColor} text-[10px] font-extrabold ring-2 ring-white shadow-xs`}
                    >
                      {step}
                    </span>
                  </span>
                  <div className="mt-6 flex flex-1 flex-col justify-between rounded-3xl border border-[#263D2E]/10 bg-white/95 p-6 shadow-[var(--shadow-soft)] transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-[var(--shadow-lifted)]">
                    <div>
                      <h3 className="font-display text-lg font-bold text-[#263D2E] sm:text-xl">
                        {title}
                      </h3>
                      <p className="mt-2 text-xs leading-relaxed text-[#72776A] sm:text-sm">
                        {body}
                      </p>
                    </div>
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
