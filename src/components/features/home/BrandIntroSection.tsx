"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Droplets, Heart, Leaf, Sprout } from "lucide-react";
import { FadeIn } from "@/components/shared/motion";
import { PageContainer } from "@/components/layout/PageContainer";
import { ASSETS } from "@/constants/assets";
import { ROUTES } from "@/constants/routes";

const BRAND_PILLARS = [
  {
    icon: Leaf,
    badgeBg: "bg-[#DDECCF]",
    iconColor: "text-[#4F8A45]",
    cardBg: "bg-[#DDECCF]/35 border-[#4F8A45]/20",
    title: "Naturally Sourced",
    description: "Farm-fresh harvests, pure seeds, and zero chemical shortcuts.",
  },
  {
    icon: Droplets,
    badgeBg: "bg-[#FFF0B8]",
    iconColor: "text-[#263D2E]",
    cardBg: "bg-[#FFF0B8]/40 border-[#FFD45A]/40",
    title: "Pure Cold-Pressed",
    description: "Gentle traditional extraction retaining natural aroma, taste, and vital nutrients.",
  },
  {
    icon: Heart,
    badgeBg: "bg-[#FFE0D4]",
    iconColor: "text-[#FF8066]",
    cardBg: "bg-[#FFE0D4]/35 border-[#FF8066]/30",
    title: "Everyday Goodness",
    description: "Wholesome natural nourishment crafted for vibrant, happier family living.",
  },
] as const;

const MINI_SHOWCASE = [
  {
    name: "Sesame Oil",
    image: ASSETS.PRODUCTS.SESAME_OIL,
    bg: "bg-[#FFF0B8]",
    border: "border-[#FFD45A]/60",
    tag: "Rich & Nutty",
  },
  {
    name: "Coconut Oil",
    image: ASSETS.PRODUCTS.COCONUT_OIL,
    bg: "bg-[#D8F3EC]",
    border: "border-[#8EDBD0]/50",
    tag: "Fresh & Light",
  },
  {
    name: "Castor Oil",
    image: ASSETS.PRODUCTS.CASTOR_OIL,
    bg: "bg-[#FFE0D4]",
    border: "border-[#FF8066]/40",
    tag: "Pure & Cooling",
  },
  {
    name: "Pure Cow Ghee",
    image: ASSETS.PRODUCTS.GHEE,
    bg: "bg-[#FFF0B8]",
    border: "border-[#FFD45A]/70",
    tag: "A2 Bilona Purity",
  },
] as const;

export function BrandIntroSection() {
  return (
    <section className="relative overflow-hidden py-14 sm:py-20 md:py-28">
      {/* Playful subtle organic backdrop circles */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-4 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-[#FFD45A]/25 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-4 bottom-4 -z-10 h-80 w-80 rounded-full bg-[#8EDBD0]/25 blur-3xl"
      />

      <PageContainer>
        <div className="relative mx-auto max-w-5xl rounded-[2.5rem] border border-[#263D2E]/10 bg-white/95 p-6 shadow-[var(--shadow-soft)] sm:p-10 md:p-16 backdrop-blur-sm">
          {/* Top playful badge */}
          <div className="flex flex-col items-center justify-center gap-3">
            <Image
              src={ASSETS.LOGO}
              alt="HEALARGO"
              width={140}
              height={96}
              className="h-12 w-auto object-contain drop-shadow-2xs"
            />
            <span className="inline-flex items-center gap-2 rounded-full bg-[#DDECCF] px-4 py-1.5 text-xs font-extrabold uppercase tracking-[0.18em] text-[#4F8A45] shadow-xs">
              <Sprout className="h-3.5 w-3.5 text-[#4F8A45]" />
              The HEALARGO Philosophy
            </span>
          </div>

          {/* Headline & Description */}
          <FadeIn className="mt-6 text-center">
            <h2 className="font-display text-3xl font-normal leading-[1.12] text-[#263D2E] sm:text-4xl md:text-5xl lg:text-6xl">
              Goodness Starts With{" "}
              <span className="relative inline-block text-[#4F8A45]">
                <span className="italic font-normal">Nature.</span>
                <svg
                  aria-hidden
                  viewBox="0 0 200 16"
                  preserveAspectRatio="none"
                  className="absolute -bottom-1.5 left-0 h-3 w-full text-[#FFD45A]"
                >
                  <path
                    d="M 2 12 C 50 3, 150 4, 198 10 C 150 14, 60 15, 2 12 Z"
                    fill="currentColor"
                  />
                </svg>
              </span>
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#72776A] sm:text-lg">
              At <strong className="font-bold text-[#263D2E]">HEALARGO</strong>, we believe everyday wellness begins in the kitchen. We partner with responsible growers to cold-press the purest natural seeds—delivering unrefined edible oils with wholesome aroma, honest purity, and genuine natural care.
            </p>
          </FadeIn>

          {/* Photography Mini Showcase */}
          <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4 sm:gap-6">
            {MINI_SHOWCASE.map((item) => (
              <div
                key={item.name}
                className={`group relative overflow-hidden rounded-2xl border ${item.border} ${item.bg} p-4 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-md`}
              >
                <div className="relative mx-auto aspect-square w-full max-w-[200px] overflow-hidden rounded-xl bg-white/70 shadow-xs">
                  <Image
                    src={item.image}
                    alt={`HEALARGO ${item.name}`}
                    fill
                    unoptimized
                    className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#263D2E] shadow-xs">
                    {item.tag}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-base font-bold text-[#263D2E]">
                  {item.name}
                </h3>
              </div>
            ))}
          </div>

          {/* Three Vibrant Playful Nature Value Cards */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {BRAND_PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className={`rounded-2xl border ${pillar.cardBg} p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xs`}
                >
                  <span
                    className={`mx-auto flex h-11 w-11 items-center justify-center rounded-2xl ${pillar.badgeBg} ${pillar.iconColor} shadow-xs`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-3.5 font-display text-base font-bold text-[#263D2E]">
                    {pillar.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-[#72776A] leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Bottom link */}
          <div className="mt-9 flex justify-center">
            <Link
              href={ROUTES.ABOUT}
              className="group inline-flex items-center gap-2 text-sm font-bold text-[#4F8A45] transition hover:text-[#263D2E]"
            >
              <span className="border-b-2 border-[#4F8A45]/30 pb-0.5 transition group-hover:border-[#4F8A45]">
                Read Our Story & Sourcing Journey
              </span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </PageContainer>
    </section>
  );
}
