"use client";

import { Leaf, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { Stagger, StaggerItem } from "@/components/shared/motion";
import { PageContainer } from "@/components/layout/PageContainer";

const FEATURES = [
  {
    icon: Leaf,
    title: "Naturally Sourced",
    description: "Pure botanical ingredients with zero artificial shortcuts",
    accentBg: "bg-[#DDECCF]",
    accentIcon: "text-[#4F8A45]",
  },
  {
    icon: ShieldCheck,
    title: "Quality Focused",
    description: "Carefully checked and tested for uncompromised purity",
    accentBg: "bg-[#FFF0B8]",
    accentIcon: "text-[#263D2E]",
  },
  {
    icon: Sparkles,
    title: "Everyday Goodness",
    description: "Gentle, wholesome nourishment crafted for everyday family meals",
    accentBg: "bg-[#FFE0D4]",
    accentIcon: "text-[#FF8066]",
  },
  {
    icon: Truck,
    title: "Delivered With Care",
    description: "Safe, tamper-evident packaging dispatched directly to your doorstep",
    accentBg: "bg-[#D8F3EC]",
    accentIcon: "text-[#263D2E]",
  },
] as const;

export function TrustStrip() {
  return (
    <section aria-label="Brand Benefits" className="relative z-10 -mt-4 md:-mt-6">
      <PageContainer>
        <Stagger className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, description, accentBg, accentIcon }) => (
            <StaggerItem key={title}>
              <div className="group flex h-full items-start gap-4 rounded-2xl border border-[#263D2E]/10 bg-white p-5 shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-1.5 hover:border-[#4F8A45]/40 hover:shadow-[var(--shadow-lifted)] sm:p-6">
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${accentBg} ${accentIcon} shadow-2xs transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6`}
                >
                  <Icon className="h-6 w-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-base font-bold text-[#263D2E]">
                    {title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-[#72776A] sm:text-sm">
                    {description}
                  </p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </PageContainer>
    </section>
  );
}
