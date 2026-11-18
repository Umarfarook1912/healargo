"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Leaf, Sparkles, Sun, Droplets } from "lucide-react";
import { FadeIn } from "@/components/shared/motion";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { ASSETS } from "@/constants/assets";

export function LifestyleSection() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Decorative vibrant organic shapes */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-1/4 -z-10 h-96 w-96 rounded-full bg-[#FFD45A]/30 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 bottom-10 -z-10 h-80 w-80 rounded-full bg-[#8EDBD0]/35 blur-3xl"
      />

      <PageContainer>
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Left Column: Visual Editorial Collage */}
          <div className="relative order-2 lg:order-1 lg:col-span-7">
            {/* Playful background card offset */}
            <div
              aria-hidden
              className="absolute -inset-3 -z-10 rounded-[2.5rem] bg-[#FFD45A]/30 sm:rounded-[3rem]"
            />

            <div className="relative grid grid-cols-12 gap-4 sm:gap-6">
              {/* Main large collection photo */}
              <div className="col-span-7 aspect-4/5 overflow-hidden rounded-[2rem] border-3 border-white bg-white shadow-[var(--shadow-lifted)] sm:rounded-[2.5rem]">
                <Image
                  src={ASSETS.COLLECTION_BANNER}
                  alt="Nature's Goodness Bottled — HEALARGO"
                  width={600}
                  height={750}
                  unoptimized
                  className="h-full w-full object-cover object-center transition-transform duration-700 hover:scale-105"
                />
              </div>

              {/* Secondary stacked editorial pastel cards */}
              <div className="col-span-5 flex flex-col justify-between gap-4 sm:gap-6">
                <div className="relative aspect-square overflow-hidden rounded-[1.75rem] border border-[#FFD45A]/70 bg-[#FFF0B8] p-5 shadow-xs sm:rounded-[2.25rem] flex flex-col justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFD45A] text-[#263D2E] shadow-2xs">
                    <Sun className="h-5 w-5 animate-spin-slow" />
                  </div>
                  <div>
                    <p className="font-display text-lg font-bold text-[#263D2E] leading-tight sm:text-xl">
                      Sun-Drenched Sourcing
                    </p>
                    <p className="mt-1 text-xs text-[#72776A]">
                      Direct from natural agro harvests
                    </p>
                  </div>
                </div>

                <div className="relative aspect-square overflow-hidden rounded-[1.75rem] border border-[#FF8066]/40 bg-[#FFE0D4] p-5 shadow-xs sm:rounded-[2.25rem] flex flex-col justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FF8066] text-white shadow-2xs">
                    <Droplets className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-display text-lg font-bold text-[#263D2E] leading-tight sm:text-xl">
                      Pure & Honest
                    </p>
                    <p className="mt-1 text-xs text-[#72776A]">
                      Gentle, unhurried cold pressing
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Playful Accent Pill */}
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 rounded-full border border-white/80 bg-white px-6 py-2.5 shadow-lg backdrop-blur sm:left-10 sm:translate-x-0">
              <p className="flex items-center gap-2 text-xs font-bold text-[#4F8A45]">
                <Leaf className="h-4 w-4 text-[#4F8A45]" />
                Made for Your Everyday Rituals
              </p>
            </div>
          </div>

          {/* Right Column: Editorial Typography */}
          <FadeIn className="order-1 lg:order-2 lg:col-span-5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#4F8A45]/20 bg-[#DDECCF] px-4 py-1.5 text-xs font-extrabold uppercase tracking-[0.18em] text-[#4F8A45]">
              <Sparkles className="h-3.5 w-3.5 text-[#FFD45A]" />
              Nature&apos;s Goodness, Bottled
            </span>

            <h2 className="mt-4 font-display text-4xl font-normal leading-[1.08] text-[#263D2E] sm:text-5xl lg:text-[3.5rem]">
              Make Room for{" "}
              <span className="relative inline-block text-[#4F8A45]">
                <span className="italic font-normal">Natural Goodness.</span>
                <svg
                  aria-hidden
                  viewBox="0 0 240 18"
                  preserveAspectRatio="none"
                  className="absolute -bottom-1.5 left-0 h-3.5 w-full text-[#FFD45A]"
                >
                  <path
                    d="M 3 14 C 60 4, 160 5, 237 11 C 180 16, 70 17, 3 14 Z"
                    fill="currentColor"
                  />
                </svg>
              </span>
            </h2>

            <p className="mt-5 text-base leading-relaxed text-[#29352B]/80 sm:text-lg">
              Food is our closest daily connection to the earth. HEALARGO invites you to savor pure authentic aromas, rich natural textures, and unadulterated cold-pressed oils that make cooking a joyous ritual.
            </p>

            <ul className="mt-7 space-y-3.5 text-sm font-semibold text-[#29352B]">
              <li className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#DDECCF] text-[#4F8A45]">
                  ✓
                </span>
                <span>Single-origin seeds dried naturally under warm sunlight</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FFF0B8] text-[#263D2E]">
                  ✓
                </span>
                <span>Traditional low-heat cold pressing</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FFE0D4] text-[#FF8066]">
                  ✓
                </span>
                <span>Naturally sedimented without chemical bleaching or solvent refining</span>
              </li>
            </ul>

            <div className="mt-9 flex items-center gap-4">
              <Button size="lg" className="bg-[#4F8A45] hover:bg-[#263D2E] text-white shadow-md shadow-[#4F8A45]/20" asChild>
                <Link href={ROUTES.SHOP}>
                  Explore the Collection
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </PageContainer>
    </section>
  );
}
