"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/PageContainer";
import { WhatsAppLogo } from "@/components/common/SocialLinks";
import { ASSETS } from "@/constants/assets";
import { ROUTES } from "@/constants/routes";
import { buildWhatsAppUrl } from "@/lib/utils/whatsapp";

export function PromoBanner() {
  const reduce = useReducedMotion();

  return (
    <section className="py-10 md:py-16">
      <PageContainer>
        <motion.div
          className="forest-gradient relative isolate w-full overflow-hidden rounded-[2.25rem] px-6 py-14 text-center text-white shadow-[var(--shadow-lifted)] sm:px-10 md:rounded-[2.75rem] md:px-16 md:py-20"
          initial={reduce ? false : { opacity: 0, y: 32 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Subtle playful auras */}
          <span
            aria-hidden
            className="pointer-events-none absolute -left-16 -top-16 -z-10 h-64 w-64 rounded-full border border-[#FFD45A]/25 animate-spin-slow"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-24 -right-10 -z-10 h-80 w-80 rounded-full bg-[#FFD45A]/15 blur-3xl"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute top-10 right-10 -z-10 h-60 w-60 rounded-full bg-[#8EDBD0]/20 blur-2xl"
          />

          <div className="mx-auto mb-5 flex justify-center">
            <Image
              src={ASSETS.LOGO_LIGHT}
              alt="HEALARGO"
              width={160}
              height={110}
              className="h-16 w-auto object-contain drop-shadow-md"
            />
          </div>

          <span className="mx-auto inline-flex items-center gap-2 rounded-full border border-[#FFD45A]/40 bg-white/10 px-4 py-1.5 text-xs font-extrabold uppercase tracking-[0.2em] text-[#FFD45A] backdrop-blur-xs">
            <Sparkles className="h-3.5 w-3.5" />
            HEALARGO NATURE COLLECTION
          </span>

          <h2 className="mx-auto mt-5 max-w-3xl font-display text-4xl leading-[1.08] text-white sm:text-5xl md:text-6xl font-bold">
            Goodness, <span className="italic text-[#FFD45A]">Delivered with Care</span>
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-base text-[#FFF8E9]/85 sm:text-lg">
            Free doorstep delivery on qualifying orders across India — enjoy pure cold-pressed coconut, sesame, and groundnut oils for your family.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              className="group w-full gap-2 bg-[#FFD45A] text-[#263D2E] font-bold px-8 shadow-md hover:bg-[#ffe17d] sm:w-auto"
              asChild
            >
              <Link href={ROUTES.SHOP}>
                Shop Now
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full gap-2 border-white/30 bg-white/10 px-8 text-white hover:border-white hover:bg-white hover:text-[#263D2E] sm:w-auto font-semibold"
              asChild
            >
              <a
                href={buildWhatsAppUrl("Hi HEALARGO! I would like to place an order.")}
                target="_blank"
                rel="noopener noreferrer"
              >
                <WhatsAppLogo className="h-4 w-4" />
                Order on WhatsApp
              </a>
            </Button>
          </div>
        </motion.div>
      </PageContainer>
    </section>
  );
}
