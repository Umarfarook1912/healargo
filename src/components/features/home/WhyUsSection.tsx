"use client";

import Link from "next/link";
import { ArrowRight, BadgeCheck, Gem, Sprout, Truck, Sparkles } from "lucide-react";
import { FadeIn, Stagger, StaggerItem } from "@/components/shared/motion";
import { PageContainer } from "@/components/layout/PageContainer";
import { ROUTES } from "@/constants/routes";
import { UI } from "@/constants/ui";

const FEATURES = [
  {
    icon: Sprout,
    badgeBg: "bg-[#DDECCF]",
    iconColor: "text-[#4F8A45]",
    cardBorder: "border-[#4F8A45]/20 hover:border-[#4F8A45]",
    cardBg: "bg-white",
    title: "Thoughtfully Sourced",
    body: "We select natural seeds with care—prioritizing purity, harvest freshness, and honest origin.",
  },
  {
    icon: BadgeCheck,
    badgeBg: "bg-[#FFF0B8]",
    iconColor: "text-[#263D2E]",
    cardBorder: "border-[#FFD45A]/40 hover:border-[#FFD45A]",
    cardBg: "bg-white",
    title: "Cold-Pressed Purity",
    body: "Zero artificial heat, zero chemical refining, and no added preservatives. Pure kitchen essentials.",
  },
  {
    icon: Gem,
    badgeBg: "bg-[#FFE0D4]",
    iconColor: "text-[#FF8066]",
    cardBorder: "border-[#FF8066]/30 hover:border-[#FF8066]",
    cardBg: "bg-white",
    title: "Sensory Quality",
    body: "From natural aroma to golden clarity, our unrefined oils bring rich culinary joy to everyday meals.",
  },
  {
    icon: Truck,
    badgeBg: "bg-[#D8F3EC]",
    iconColor: "text-[#4F8A45]",
    cardBorder: "border-[#8EDBD0]/40 hover:border-[#8EDBD0]",
    cardBg: "bg-white",
    title: "Direct to Your Door",
    body: "Carefully sealed, safely packed, and dispatched across India with reachable email & WhatsApp care.",
  },
] as const;

export function WhyUsSection() {
  return (
    <section className="relative isolate overflow-hidden py-16 sm:py-20 md:py-28">
      {/* Playful background ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-20 top-1/2 -z-10 h-96 w-96 -translate-y-1/2 rounded-full bg-[#FFD45A]/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 top-1/3 -z-10 h-80 w-80 rounded-full bg-[#8EDBD0]/25 blur-3xl"
      />

      <PageContainer className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 items-center">
        <FadeIn className="lg:sticky lg:top-28 lg:self-start">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#4F8A45]/30 bg-white/90 px-3.5 py-1 text-xs font-extrabold uppercase tracking-[0.16em] text-[#4F8A45] shadow-xs backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-[#FFD45A]" />
            Why {UI.brand}
          </div>
          <h2 className="mt-5 font-display text-3xl font-normal leading-[1.12] text-[#263D2E] sm:text-4xl lg:text-5xl">
            Everyday Living,{" "}
            <span className="relative inline-block text-[#4F8A45]">
              <span className="italic font-normal">Naturally Good</span>
              <svg
                aria-hidden
                viewBox="0 0 220 16"
                preserveAspectRatio="none"
                className="absolute -bottom-1.5 left-0 h-3 w-full text-[#FFD45A]"
              >
                <path
                  d="M 2 12 C 50 3, 160 4, 218 10 C 160 14, 60 15, 2 12 Z"
                  fill="currentColor"
                />
              </svg>
            </span>
          </h2>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-[#72776A] sm:text-lg">
            {UI.brand} brings thoughtfully sourced natural edible oils and agro products into a modern, transparent, and joyful shopping experience.
          </p>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold">
            <Link
              href={ROUTES.ABOUT}
              className="group inline-flex items-center gap-2 text-[#4F8A45] hover:text-[#263D2E] transition-colors"
            >
              <span className="border-b-2 border-[#4F8A45]/30 pb-0.5 transition-colors group-hover:border-[#4F8A45]">
                Our Story
              </span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href={ROUTES.CERTIFICATES}
              className="group inline-flex items-center gap-2 text-[#4F8A45] hover:text-[#263D2E] transition-colors"
            >
              <span className="border-b-2 border-[#4F8A45]/30 pb-0.5 transition-colors group-hover:border-[#4F8A45]">
                Quality Certificates
              </span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </FadeIn>

        <Stagger className="grid gap-4 sm:grid-cols-2 sm:gap-5" delay={0.1}>
          {FEATURES.map(({ icon: Icon, badgeBg, iconColor, cardBorder, cardBg, title, body }, index) => (
            <StaggerItem key={title} className={index % 2 === 1 ? "sm:translate-y-6" : undefined}>
              <div
                className={`group h-full rounded-3xl border ${cardBorder} ${cardBg} p-6 shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[var(--shadow-lifted)] sm:p-7`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${badgeBg} ${iconColor} shadow-xs transition-transform duration-300 group-hover:scale-110`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span aria-hidden className="font-display text-2xl font-bold text-[#263D2E]/20">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-lg font-bold text-[#263D2E] sm:text-xl">
                  {title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-[#72776A] sm:text-sm">{body}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </PageContainer>
    </section>
  );
}
