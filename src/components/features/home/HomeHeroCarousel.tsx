"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/PageContainer";
import { cn } from "@/lib/utils/cn";
import type { CarouselSlide } from "@/types/carousel";
import { HomeHero } from "@/components/features/home/HomeHero";

interface HomeHeroCarouselProps {
  slides?: CarouselSlide[];
  fallbackToDefault?: boolean;
}

const AUTOPLAY_INTERVAL_MS = 5000;

export function HomeHeroCarousel({
  slides = [],
  fallbackToDefault = true,
}: HomeHeroCarouselProps) {
  const reduce = useReducedMotion();
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Filter only active slides and sort by sortOrder ascending
  const activeSlides = slides
    .filter((s) => s.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const count = activeSlides.length;

  const nextSlide = useCallback(() => {
    if (count <= 1) return;
    setDirection(1);
    setCurrent((prev) => (prev + 1) % count);
  }, [count]);

  const prevSlide = useCallback(() => {
    if (count <= 1) return;
    setDirection(-1);
    setCurrent((prev) => (prev - 1 + count) % count);
  }, [count]);

  const goToSlide = useCallback((index: number) => {
    if (index === current) return;
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
  }, [current]);

  // Autoplay effect
  useEffect(() => {
    if (count <= 1 || isHovered) return;

    const timer = setInterval(() => {
      nextSlide();
    }, AUTOPLAY_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [count, isHovered, nextSlide]);

  // Reset current index if slides change
  useEffect(() => {
    if (current >= count) {
      setCurrent(0);
    }
  }, [count, current]);

  // Mobile swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (Math.abs(diff) > minSwipeDistance) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Graceful fallback to existing HomeHero if no active slides exist
  if (count === 0) {
    if (fallbackToDefault) {
      return <HomeHero />;
    }
    return null;
  }

  const slide = activeSlides[current];

  return (
    <section
      aria-label="Hero Carousel"
      className="herbal-gradient relative overflow-hidden pb-6 pt-3 sm:pb-10 sm:pt-6"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <PageContainer className="px-3 sm:px-6">
        <div className="relative isolate min-h-[480px] w-full overflow-hidden rounded-[1.75rem] bg-dark shadow-[var(--shadow-lifted)] ring-1 ring-dark/10 sm:min-h-[540px] sm:rounded-[2.25rem] md:min-h-[600px] lg:min-h-[640px]">
          <AnimatePresence initial={false} custom={direction} mode="sync">
            <motion.div
              key={slide._id || current}
              custom={direction}
              initial={
                reduce
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 1.04, x: direction > 0 ? "3%" : "-3%" }
              }
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={
                reduce
                  ? { opacity: 0 }
                  : { opacity: 0, x: direction > 0 ? "-3%" : "3%" }
              }
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 z-0 h-full w-full"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={slide.imageUrl}
                alt={slide.altText || slide.headline || "Healargo banner"}
                className="h-full w-full object-cover object-center"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://ik.imagekit.io/mnm0iz0ng2/banner/1.png";
                }}
              />
              {/* Contrast overlays keep text readable on any banner */}
              <div className="absolute inset-0 bg-gradient-to-t from-dark/95 via-dark/50 to-dark/10 sm:bg-gradient-to-r sm:from-dark/90 sm:via-dark/55 sm:to-transparent" />
              <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-dark/60 to-transparent" />
            </motion.div>
          </AnimatePresence>

          {/* Decorative gold arcs */}
          <span aria-hidden className="pointer-events-none absolute -right-24 -top-24 z-[1] h-80 w-80 rounded-full border border-accent/25" />
          <span aria-hidden className="pointer-events-none absolute -bottom-32 right-24 z-[1] hidden h-72 w-72 rounded-full border border-cream/10 md:block" />

          {/* Content */}
          <div className="relative z-10 flex h-full min-h-[480px] w-full max-w-3xl flex-col justify-end p-6 pb-24 text-white sm:min-h-[540px] sm:p-10 sm:pb-28 md:min-h-[600px] md:p-14 md:pb-28 lg:min-h-[640px] lg:p-16 lg:pb-32">
            <motion.span
              key={`eyebrow-${slide._id || current}`}
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-accent/40 bg-dark/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-accent backdrop-blur-md"
            >
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent" />
              Healargo
            </motion.span>

            {slide.headline ? (
              <motion.h2
                key={`headline-${slide._id || current}`}
                initial={reduce ? false : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="font-display text-[2rem] leading-[1.08] tracking-tight text-white drop-shadow-md sm:text-5xl md:text-6xl lg:text-7xl"
              >
                {slide.headline}
              </motion.h2>
            ) : null}

            {slide.subheadline ? (
              <motion.p
                key={`subheadline-${slide._id || current}`}
                initial={reduce ? false : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mt-4 max-w-xl text-sm leading-relaxed text-cream/90 drop-shadow-xs sm:mt-5 sm:text-base md:text-lg"
              >
                {slide.subheadline}
              </motion.p>
            ) : null}

            {slide.buttonText ? (
              <motion.div
                key={`cta-${slide._id || current}`}
                initial={reduce ? false : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-7 flex items-center gap-3 sm:mt-9"
              >
                <Button
                  size="lg"
                  variant="accent"
                  className="group gap-2 px-8 text-sm font-semibold shadow-lg shadow-black/25 sm:text-base"
                  asChild
                >
                  <Link href={slide.navigationLink || "/shop"}>
                    {slide.buttonText}
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </Button>
              </motion.div>
            ) : null}
          </div>

          {/* Bottom control bar: counter, progress dots, prev/next */}
          {count > 1 && (
            <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between gap-4 px-6 pb-6 sm:px-10 sm:pb-8 md:px-14 lg:px-16">
              <div className="flex items-center gap-3 text-white">
                <span className="font-mono text-sm font-semibold text-accent">
                  {String(current + 1).padStart(2, "0")}
                </span>
                <div className="flex items-center gap-1.5">
                  {activeSlides.map((s, idx) => (
                    <button
                      key={s._id || idx}
                      type="button"
                      aria-label={`Go to slide ${idx + 1}`}
                      onClick={() => goToSlide(idx)}
                      className={cn(
                        "h-1 rounded-full transition-all duration-500",
                        idx === current
                          ? "w-10 bg-accent"
                          : "w-4 bg-white/35 hover:bg-white/70",
                      )}
                    />
                  ))}
                </div>
                <span className="font-mono text-sm text-white/60">
                  {String(count).padStart(2, "0")}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Previous slide"
                  onClick={prevSlide}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-md transition-all hover:border-accent hover:bg-accent hover:text-accent-foreground active:scale-95 sm:h-12 sm:w-12"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  aria-label="Next slide"
                  onClick={nextSlide}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-md transition-all hover:border-accent hover:bg-accent hover:text-accent-foreground active:scale-95 sm:h-12 sm:w-12"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </PageContainer>
    </section>
  );
}
