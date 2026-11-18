"use client";

import { Quote, Sparkles, Star } from "lucide-react";
import { Stagger, StaggerItem } from "@/components/shared/motion";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionHeading } from "@/components/features/home/SectionHeading";
import { UI } from "@/constants/ui";
import { cn } from "@/lib/utils/cn";

const STORIES = [
  {
    initials: "AK",
    name: "Ananya Krishnan",
    place: "Bengaluru",
    body: "The cold-pressed sesame oil has an incredible authentic aroma that reminded me of my grandmother's cooking. The packaging was clean and arrived quickly.",
    product: "Sesame Oil",
    bg: "bg-[#FFF0B8]/60 border-[#FFD45A]/70",
    badgeBg: "bg-[#FFD45A] text-[#263D2E]",
    avatarBg: "bg-[#FFD45A] text-[#263D2E]",
  },
  {
    initials: "RV",
    name: "Rohan Verma",
    place: "Pune",
    body: "Loved the unrefined coconut oil. Perfectly clear, fresh fragrance, and not heavy. Great to see genuine natural edible oils with honest transparency.",
    product: "Coconut Oil",
    bg: "bg-[#D8F3EC]/60 border-[#8EDBD0]/70",
    badgeBg: "bg-[#8EDBD0] text-[#263D2E]",
    avatarBg: "bg-[#8EDBD0] text-[#263D2E]",
  },
  {
    initials: "SM",
    name: "Sneha Mehta",
    place: "Hyderabad",
    body: "Purchased the pure cow ghee and cold-pressed castor oil. The rich aroma of the ghee and the authentic quality of the castor oil are outstanding. Ordering was seamless!",
    product: "Pure Cow Ghee",
    bg: "bg-[#FFE0D4]/60 border-[#FF8066]/50",
    badgeBg: "bg-[#FF8066] text-white",
    avatarBg: "bg-[#FF8066] text-white",
  },
] as const;

export function TestimonialsSection() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-20 md:py-28">
      {/* Playful background ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-16 bottom-10 -z-10 h-72 w-72 rounded-full bg-[#FFD45A]/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-1/4 top-10 -z-10 h-80 w-80 rounded-full bg-[#8EDBD0]/25 blur-3xl"
      />

      <PageContainer>
        <SectionHeading
          eyebrow={
            <span className="inline-flex items-center gap-1.5 font-extrabold text-[#4F8A45]">
              <Sparkles className="h-4 w-4 text-[#FFD45A]" />
              Real Family Feedback
            </span>
          }
          title={<>Loved by {UI.brand} Households</>}
          description="Honest experiences from families enjoying our pure cold-pressed oils in everyday cooking."
        />
        <Stagger className="mt-12 grid gap-6 lg:grid-cols-3" delay={0.1}>
          {STORIES.map((story) => (
            <StaggerItem key={story.name}>
              <figure
                className={cn(
                  "group relative flex h-full flex-col justify-between overflow-hidden rounded-[2rem] border p-7 shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[var(--shadow-lifted)] sm:p-8 backdrop-blur-xs",
                  story.bg
                )}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <Quote aria-hidden className="h-8 w-8 text-[#263D2E]/30" />
                    <div className="flex items-center gap-1 text-[#4F8A45]">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                  </div>

                  <blockquote className="mt-5 font-display text-base leading-relaxed text-[#263D2E] sm:text-lg">
                    “{story.body}”
                  </blockquote>
                </div>

                <figcaption className="mt-8 flex items-center gap-3.5 border-t border-[#263D2E]/10 pt-5">
                  <span
                    className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-bold shadow-xs",
                      story.avatarBg
                    )}
                  >
                    {story.initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-sm font-bold text-[#263D2E]">
                      {story.name}
                    </p>
                    <p className="text-xs text-[#72776A]">{story.place}</p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-[11px] font-extrabold shadow-2xs",
                      story.badgeBg
                    )}
                  >
                    {story.product}
                  </span>
                </figcaption>
              </figure>
            </StaggerItem>
          ))}
        </Stagger>
      </PageContainer>
    </section>
  );
}
