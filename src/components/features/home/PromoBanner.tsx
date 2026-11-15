"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/PageContainer";
import { WhatsAppLogo } from "@/components/common/SocialLinks";
import { HOME_HERO } from "@/constants/home";
import { ROUTES } from "@/constants/routes";
import { buildWhatsAppUrl } from "@/lib/utils/whatsapp";

export function PromoBanner() {
  const reduce = useReducedMotion();

  return (
    <section className="pb-4 pt-8 md:pt-12">
      <PageContainer>
        <motion.div
          className="forest-gradient relative isolate w-full overflow-hidden rounded-[2rem] px-6 py-14 text-center text-primary-foreground shadow-[var(--shadow-lifted)] sm:px-10 md:rounded-[2.5rem] md:px-16 md:py-20"
          initial={reduce ? false : { opacity: 0, y: 32 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <span aria-hidden className="pointer-events-none absolute -left-16 -top-16 -z-10 h-64 w-64 rounded-full border border-accent/25" />
          <span aria-hidden className="pointer-events-none absolute -left-4 -top-4 -z-10 h-40 w-40 rounded-full border border-accent/15" />
          <span aria-hidden className="pointer-events-none absolute -bottom-24 -right-10 -z-10 h-80 w-80 rounded-full bg-accent/15 blur-3xl" />

          <span className="mx-auto inline-flex items-center gap-2 rounded-full border border-accent/40 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            <Truck className="h-3.5 w-3.5" />
            Healargo
          </span>
          <h2 className="mx-auto mt-5 max-w-3xl font-display text-4xl leading-[1.08] text-white sm:text-5xl md:text-6xl">
            Natural wellness, <span className="italic text-accent">delivered with care</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base text-cream/80 sm:text-lg">
            Free delivery on eligible orders — shop thoughtfully sourced products
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" variant="accent" className="group w-full gap-2 px-8 sm:w-auto" asChild>
              <Link href={ROUTES.SHOP}>
                Shop Now
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full gap-2 border-white/30 bg-white/5 px-8 text-white hover:border-white hover:bg-white hover:text-dark sm:w-auto"
              asChild
            >
              <a
                href={buildWhatsAppUrl(HOME_HERO.whatsappMessage)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <WhatsAppLogo className="h-4 w-4" />
                {HOME_HERO.ctaWhatsApp}
              </a>
            </Button>
          </div>
        </motion.div>
      </PageContainer>
    </section>
  );
}
