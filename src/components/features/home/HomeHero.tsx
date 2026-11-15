"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Leaf, ShieldCheck, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/PageContainer";
import { WhatsAppLogo } from "@/components/common/SocialLinks";
import { ASSETS } from "@/constants/assets";
import { HOME_HERO } from "@/constants/home";
import { ROUTES } from "@/constants/routes";
import { SITE_DESCRIPTION } from "@/constants/seo";
import { UI } from "@/constants/ui";
import { buildWhatsAppUrl } from "@/lib/utils/whatsapp";

const EASE = [0.22, 1, 0.36, 1] as const;

const TRUST_PILLS = [
  `★★★★★ ${UI.trustRating}`,
  `${HOME_HERO.trustedPrefix} ${UI.trustFamilies} ${HOME_HERO.trustedSuffix}`,
  `${UI.trustYears} ${HOME_HERO.yearsSuffix}`,
  HOME_HERO.fssai,
] as const;

export function HomeHero() {
  const reduce = useReducedMotion();
  const rise = (delay: number, y = 22) => ({
    initial: reduce ? false : { opacity: 0, y },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease: EASE },
  });

  return (
    <section className="herbal-gradient relative isolate overflow-hidden">
      <span aria-hidden className="pointer-events-none absolute -left-32 top-24 -z-10 h-80 w-80 rounded-full bg-primary/[0.06] blur-3xl" />
      <span aria-hidden className="pointer-events-none absolute -right-20 -top-20 -z-10 h-96 w-96 rounded-full bg-accent/15 blur-3xl" />

      <PageContainer className="grid items-center gap-10 py-10 sm:py-14 lg:min-h-[78vh] lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-20">
        <div className="relative z-10 order-2 lg:order-1">
          <motion.p
            {...rise(0, 14)}
            className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-card/80 py-1 pl-1 pr-3 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-primary shadow-[var(--shadow-soft)] backdrop-blur sm:text-xs"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Leaf className="h-3.5 w-3.5" />
            </span>
            {UI.since}
          </motion.p>

          <motion.h1
            {...rise(0.08, 28)}
            className="mt-5 font-display text-[2.4rem] leading-[1.05] text-dark sm:text-6xl lg:text-7xl xl:text-[5.25rem]"
          >
            {HOME_HERO.titleBefore}{" "}
            <span className="relative inline-block text-primary">
              <span className="italic">{HOME_HERO.titleHighlight}</span>
              <svg
                aria-hidden
                viewBox="0 0 200 12"
                preserveAspectRatio="none"
                className="absolute -bottom-1 left-0 h-3 w-full text-accent"
              >
                <path d="M2 9c40-6 120-8 196-3" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </span>{" "}
            <span className="block sm:inline">{HOME_HERO.titleAfter}</span>
          </motion.h1>

          <motion.p
            {...rise(0.16, 20)}
            className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:mt-6 sm:text-lg"
          >
            {SITE_DESCRIPTION}
          </motion.p>

          <motion.div
            {...rise(0.24, 16)}
            className="mt-7 flex flex-col gap-3 sm:mt-9 sm:flex-row sm:flex-wrap"
          >
            <Button size="lg" className="group w-full gap-2 px-7 sm:w-auto" asChild>
              <Link href={ROUTES.BESTSELLERS}>
                {HOME_HERO.ctaShop}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button size="lg" variant="whatsapp" className="w-full gap-2 px-7 sm:w-auto" asChild>
              <a
                href={buildWhatsAppUrl(HOME_HERO.whatsappMessage)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <WhatsAppLogo className="h-4 w-4" />
                {HOME_HERO.ctaWhatsApp}
              </a>
            </Button>
          </motion.div>

          <motion.ul
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.36 }}
            className="mt-8 grid grid-cols-2 gap-2.5 sm:mt-10 sm:flex sm:flex-wrap sm:gap-3"
          >
            {TRUST_PILLS.map((label) => (
              <li
                key={label}
                className="rounded-full border border-border/80 bg-card/90 px-3.5 py-2 text-center text-xs font-medium leading-snug text-dark/85 shadow-[var(--shadow-soft)] backdrop-blur sm:text-left sm:text-sm"
              >
                {label}
              </li>
            ))}
          </motion.ul>
        </div>

        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.1, ease: EASE }}
          className="relative order-1 mx-auto w-full max-w-md sm:max-w-lg lg:order-2 lg:max-w-none"
        >
          <div aria-hidden className="absolute inset-4 -z-10 translate-x-4 translate-y-4 rounded-t-[999px] rounded-b-[2.5rem] border border-accent/40" />
          <div className="relative aspect-[4/5] overflow-hidden rounded-t-[999px] rounded-b-[2.5rem] border border-border/70 bg-cream shadow-[var(--shadow-lifted)] sm:aspect-[5/6]">
            <Image
              src={ASSETS.HERO}
              alt={HOME_HERO.imageAlt}
              fill
              priority
              unoptimized
              sizes="(max-width: 1024px) 90vw, 45vw"
              className="object-cover object-[68%_center]"
            />
            <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-dark/30 to-transparent" />
          </div>

          <div className="absolute -left-2 bottom-10 flex items-center gap-3 rounded-2xl border border-border/80 bg-card/95 px-4 py-3 shadow-[var(--shadow-lifted)] backdrop-blur sm:-left-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent-strong">
              <Star className="h-5 w-5 fill-current" />
            </span>
            <div className="leading-tight">
              <p className="font-display text-lg text-dark">{UI.trustFamilies}</p>
              <p className="text-xs text-muted">{HOME_HERO.trustedSuffix}</p>
            </div>
          </div>
          <div className="absolute -right-2 top-10 flex items-center gap-2 rounded-full border border-border/80 bg-card/95 py-2 pl-2 pr-4 text-sm font-semibold text-primary shadow-[var(--shadow-lifted)] backdrop-blur sm:-right-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <ShieldCheck className="h-4 w-4" />
            </span>
            {HOME_HERO.fssai}
          </div>
        </motion.div>
      </PageContainer>
    </section>
  );
}
