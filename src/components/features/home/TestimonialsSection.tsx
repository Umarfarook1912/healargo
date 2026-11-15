import { Quote } from "lucide-react";
import {
  Stagger,
  StaggerItem,
} from "@/components/shared/motion";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionHeading } from "@/components/features/home/SectionHeading";
import { UI } from "@/constants/ui";
import { cn } from "@/lib/utils/cn";

const STORIES = [
  {
    initials: "AK",
    name: "Ananya Krishnan",
    place: "Bengaluru",
    body: "The shopping experience feels calm and clear. I found what I needed quickly and the packaging was thoughtful.",
    product: "First Healargo order",
  },
  {
    initials: "RV",
    name: "Rohan Verma",
    place: "Pune",
    body: "Support replied fast on email and helped me pick the right size. Feels like a brand that actually cares.",
    product: "Repeat customer",
  },
  {
    initials: "SM",
    name: "Sneha Mehta",
    place: "Hyderabad",
    body: "Beautiful brand presence and products that feel premium without being complicated. Will order again.",
    product: "Gift order",
  },
] as const;

export function TestimonialsSection() {
  return (
    <section className="py-16 md:py-24">
      <PageContainer>
        <SectionHeading
          eyebrow="Customer Stories"
          title={<>Loved by early {UI.brand} customers</>}
        />
        <Stagger className="grid gap-5 lg:grid-cols-3" delay={0.1}>
          {STORIES.map((story, index) => {
            const featured = index === 0;
            return (
              <StaggerItem key={story.name}>
                <figure
                  className={cn(
                    "relative flex h-full flex-col overflow-hidden rounded-3xl p-7 transition-all duration-300 hover:-translate-y-1 sm:p-8",
                    featured
                      ? "forest-gradient text-cream shadow-[var(--shadow-lifted)]"
                      : "surface-card hover:shadow-[var(--shadow-lifted)]",
                  )}
                >
                  <Quote
                    aria-hidden
                    className={cn(
                      "h-9 w-9",
                      featured ? "text-accent" : "text-accent-strong/40",
                    )}
                  />
                  <p
                    aria-hidden
                    className={cn(
                      "mt-5 text-sm tracking-[0.2em]",
                      featured ? "text-accent" : "text-accent-strong",
                    )}
                  >
                    ★★★★★
                  </p>
                  <blockquote
                    className={cn(
                      "mt-3 flex-1 font-display text-lg leading-relaxed sm:text-xl",
                      featured ? "text-white" : "text-dark",
                    )}
                  >
                    “{story.body}”
                  </blockquote>
                  <figcaption
                    className={cn(
                      "mt-8 flex items-center gap-3 border-t pt-5",
                      featured ? "border-cream/15" : "border-border",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                        featured
                          ? "bg-accent text-accent-foreground"
                          : "bg-primary text-primary-foreground",
                      )}
                    >
                      {story.initials}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={cn("font-semibold", featured ? "text-white" : "text-dark")}>
                        {story.name}
                      </p>
                      <p className={cn("text-xs", featured ? "text-cream/70" : "text-muted")}>
                        {story.place}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "hidden rounded-full px-2.5 py-1 text-[11px] font-semibold sm:inline-flex",
                        featured
                          ? "bg-white/10 text-cream"
                          : "bg-primary-soft text-primary",
                      )}
                    >
                      {story.product}
                    </span>
                  </figcaption>
                </figure>
              </StaggerItem>
            );
          })}
        </Stagger>
      </PageContainer>
    </section>
  );
}
