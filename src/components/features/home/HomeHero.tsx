"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Leaf, ShieldCheck, Sparkles, Star, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/PageContainer";
import { WhatsAppLogo } from "@/components/common/SocialLinks";
import { ASSETS } from "@/constants/assets";
import { MASCOTS } from "@/constants/mascots";
import { ROUTES } from "@/constants/routes";
import { UI } from "@/constants/ui";
import { buildWhatsAppUrl } from "@/lib/utils/whatsapp";

const EASE = [0.22, 1, 0.36, 1] as const;

const TRUST_PILLS = [
  { icon: Leaf, text: "Pure & Naturally Sourced" },
  { icon: Star, text: `5.0 Rated by ${UI.trustFamilies} Families` },
  { icon: ShieldCheck, text: "FSSAI Food Safety Certified" },
  { icon: Heart, text: "Zero Added Preservatives" },
] as const;

export function HomeHero() {
  const reduce = useReducedMotion();
  const rise = (delay: number, y = 22) => ({
    initial: reduce ? false : { opacity: 0, y },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.75, delay, ease: EASE },
  });

  return (
    <section className="vibrant-gradient relative isolate overflow-hidden border-b border-[#263D2E]/10 py-10 sm:py-16 lg:py-24">
      {/* Playful Floating SVG Elements (CSS Keyframe Animations) */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-6 top-16 -z-10 h-10 w-10 sm:h-12 sm:w-12 animate-float"
      >
        <Image
          src={ASSETS.ILLUSTRATIONS.LEAF}
          alt=""
          width={48}
          height={48}
          className="h-full w-full object-contain drop-shadow-sm"
        />
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute right-12 top-10 -z-10 h-9 w-9 sm:h-11 sm:w-11 animate-spin-slow"
      >
        <Image
          src={ASSETS.ILLUSTRATIONS.SPARKLE}
          alt=""
          width={44}
          height={44}
          className="h-full w-full object-contain drop-shadow-sm"
        />
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute left-1/3 bottom-8 -z-10 h-8 w-8 sm:h-10 sm:w-10 animate-float-delayed"
      >
        <Image
          src={ASSETS.ILLUSTRATIONS.DROPLET}
          alt=""
          width={40}
          height={40}
          className="h-full w-full object-contain drop-shadow-sm"
        />
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute right-1/4 bottom-12 -z-10 h-8 w-8 sm:h-10 sm:w-10 animate-pulse-gentle"
      >
        <Image
          src={ASSETS.ILLUSTRATIONS.FLOWER}
          alt=""
          width={40}
          height={40}
          className="h-full w-full object-contain drop-shadow-sm"
        />
      </div>

      {/* Sunny organic ambient blooms */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-20 top-10 -z-20 h-80 w-80 rounded-full bg-[#FFD45A]/35 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 top-0 -z-20 h-96 w-96 rounded-full bg-[#8EDBD0]/40 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-5 left-1/2 -z-20 h-72 w-72 -translate-x-1/2 rounded-full bg-[#FFE0D4]/35 blur-3xl"
      />

      <PageContainer className="grid items-center gap-10 lg:min-h-[78vh] lg:grid-cols-[1.08fr_0.92fr] lg:gap-14">
        {/* Left Column: Expressive D2C Editorial Typography */}
        <div className="relative z-10 order-2 lg:order-1">
          {/* Small Eyebrow Pill */}
          <motion.div
            {...rise(0, 14)}
            className="inline-flex items-center gap-2 rounded-full border border-[#4F8A45]/30 bg-white/90 py-1.5 pl-2.5 pr-4 text-[0.72rem] font-extrabold uppercase tracking-[0.18em] text-[#4F8A45] shadow-xs backdrop-blur sm:text-xs"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FFD45A] text-[#263D2E]">
              <Sparkles className="h-3 w-3 animate-spin-slow" />
            </span>
            <span>GOODNESS, NATURALLY.</span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            {...rise(0.08, 24)}
            className="mt-5 font-display text-[2.65rem] leading-[1.08] tracking-tight text-[#263D2E] sm:text-6xl lg:text-[4.75rem] xl:text-[5.25rem]"
          >
            Bring a Little Nature Into{" "}
            <span className="relative inline-block text-[#4F8A45]">
              <span className="italic font-normal">Every Day.</span>
              {/* Playful Mango Yellow Highlighter Arc */}
              <svg
                aria-hidden
                viewBox="0 0 240 18"
                preserveAspectRatio="none"
                className="absolute -bottom-2 left-0 h-4 w-full text-[#FFD45A]"
              >
                <path
                  d="M 3 14 C 60 4, 160 5, 237 11 C 180 16, 70 17, 3 14 Z"
                  fill="currentColor"
                  opacity="0.95"
                />
              </svg>
            </span>
          </motion.h1>

          {/* Supporting Text */}
          <motion.p
            {...rise(0.16, 18)}
            className="mt-5 max-w-xl text-base leading-relaxed text-[#29352B]/85 sm:mt-6 sm:text-lg lg:text-xl font-normal"
          >
            Discover naturally sourced goodness for a happier, healthier everyday.
            Pure cold-pressed oils thoughtfully made from farm-fresh harvests.
          </motion.p>

          {/* Call to Actions */}
          <motion.div
            {...rise(0.24, 16)}
            className="mt-8 flex flex-col gap-3.5 sm:mt-10 sm:flex-row sm:flex-wrap sm:items-center"
          >
            <Button
              size="lg"
              className="group w-full gap-2 bg-[#4F8A45] px-8 text-white shadow-md shadow-[#4F8A45]/25 hover:bg-[#263D2E] sm:w-auto"
              asChild
            >
              <Link href={ROUTES.SHOP}>
                Explore Our Products
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="w-full gap-2 border-[#263D2E]/25 bg-white/90 px-7 text-[#263D2E] hover:border-[#4F8A45] hover:bg-[#DDECCF] sm:w-auto font-semibold"
              asChild
            >
              <Link href={ROUTES.ABOUT}>Our Story</Link>
            </Button>

            <Button
              size="lg"
              variant="whatsapp"
              className="w-full gap-2 px-6 sm:w-auto"
              asChild
            >
              <a
                href={buildWhatsAppUrl("Hi HEALARGO! I would like to explore your pure natural oils.")}
                target="_blank"
                rel="noopener noreferrer"
              >
                <WhatsAppLogo className="h-4 w-4" />
                <span>WhatsApp</span>
              </a>
            </Button>
          </motion.div>

          {/* Trust Badges Bar */}
          <motion.ul
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.35 }}
            className="mt-8 grid grid-cols-2 gap-2.5 sm:mt-10 sm:flex sm:flex-wrap sm:gap-3"
          >
            {TRUST_PILLS.map(({ icon: Icon, text }) => (
              <li
                key={text}
                className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-white/90 px-3.5 py-1.5 text-xs font-semibold text-[#29352B] shadow-2xs backdrop-blur"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#DDECCF] text-[#4F8A45]">
                  <Icon className="h-3 w-3" />
                </span>
                <span>{text}</span>
              </li>
            ))}
          </motion.ul>
        </div>

        {/* Right Column: Vibrant Art-Directed Photography */}
        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.12, ease: EASE }}
          className="relative order-1 mx-auto w-full max-w-md sm:max-w-lg lg:order-2 lg:max-w-none"
        >
          {/* Playful Layered Pastel Asymmetrical Backdrops */}
          <div
            aria-hidden
            className="absolute -inset-3 -z-10 rotate-3 rounded-[2.75rem] sm:rounded-[3.25rem] bg-[#FFD45A] opacity-90 transition-transform duration-500 hover:rotate-4"
          />
          <div
            aria-hidden
            className="absolute -inset-3 -z-20 -rotate-3 rounded-[2.75rem] sm:rounded-[3.25rem] bg-[#8EDBD0] opacity-80"
          />

          {/* Playful Floating Hero Mascot: Droppy the Golden Drop */}
          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.8, y: -20 }}
            animate={
              reduce
                ? undefined
                : {
                    opacity: 1,
                    scale: 1,
                    y: [0, -8, 0],
                    rotate: [-3, 3, -3],
                  }
            }
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.3,
            }}
            className="absolute -top-7 -right-4 sm:-top-9 sm:-right-6 z-30 h-16 w-16 sm:h-20 sm:w-20 drop-shadow-xl select-none group cursor-pointer"
          >
            <Image
              src={MASCOTS["oil-drop"].image}
              alt={MASCOTS["oil-drop"].name}
              width={80}
              height={80}
              unoptimized
              className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-115"
            />
          </motion.div>

          {/* Main Visual Frame */}
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2.5rem] sm:rounded-[3rem] border-3 border-white bg-white shadow-[var(--shadow-lifted)] sm:aspect-[5/6]">
            <Image
              src={ASSETS.HERO_BANNER}
              alt="HEALARGO Pure Cold-Pressed Oils & Pure Cow Ghee"
              fill
              priority
              unoptimized
              sizes="(max-width: 1024px) 90vw, 45vw"
              className="object-cover object-center transition-transform duration-700 hover:scale-105"
            />

            {/* Bottom floating tag in frame */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-2xl bg-white/95 px-4 py-3 shadow-lg backdrop-blur border border-white/80">
              <div>
                <p className="font-display text-sm font-bold text-[#263D2E]">
                  Cold Pressed & Unrefined
                </p>
                <p className="text-[11px] text-[#72776A]">
                  Sesame • Coconut • Castor • Ghee
                </p>
              </div>
              <span className="rounded-full bg-[#FFD45A] px-3 py-1 text-[11px] font-extrabold text-[#263D2E]">
                100% Honest
              </span>
            </div>
          </div>

          {/* Floating Pill: Customer Rating */}
          <motion.div
            animate={reduce ? undefined : { y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -left-2 top-8 flex items-center gap-3 rounded-2xl border border-white/80 bg-white/95 px-4 py-2.5 shadow-lg backdrop-blur sm:-left-6"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF8066] text-white">
              <Star className="h-5 w-5 fill-current" />
            </span>
            <div className="leading-tight">
              <p className="font-display text-base font-bold text-[#263D2E]">
                {UI.trustRating} / 5.0
              </p>
              <p className="text-[11px] text-[#72776A]">Customer Loved</p>
            </div>
          </motion.div>

          {/* Floating Pill: Quality Verified */}
          <motion.div
            animate={reduce ? undefined : { y: [0, 6, 0] }}
            transition={{
              duration: 4.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5,
            }}
            className="absolute -right-2 bottom-20 flex items-center gap-2 rounded-full border border-white/80 bg-white/95 py-2 pl-2.5 pr-4 text-xs font-bold text-[#4F8A45] shadow-lg backdrop-blur sm:-right-4"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#4F8A45] text-white">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <span className="text-[#263D2E]">Certified Pure</span>
          </motion.div>
        </motion.div>
      </PageContainer>
    </section>
  );
}
