import {
  FadeIn,
  Stagger,
  StaggerItem,
} from "@/components/shared/motion";
import { PageContainer } from "@/components/layout/PageContainer";
import { UI } from "@/constants/ui";

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
    <section className="py-16">
      <PageContainer>
        <FadeIn>
          <p className="text-sm font-medium uppercase tracking-wide text-primary">
            Customer Stories
          </p>
          <h2 className="mt-2 font-display text-3xl text-dark md:text-4xl">
            Loved by early {UI.brand} customers
          </h2>
        </FadeIn>
        <Stagger className="mt-10 grid gap-6 md:grid-cols-3" delay={0.1}>
          {STORIES.map((story) => (
            <StaggerItem key={story.name}>
              <blockquote className="h-full rounded-lg border border-border bg-card p-6 transition-shadow hover:shadow-md">
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                    {story.initials}
                  </span>
                  <div>
                    <p className="font-medium text-dark">{story.name}</p>
                    <p className="text-xs text-muted">{story.place}</p>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-dark/80">
                  “{story.body}”
                </p>
                <p className="mt-4 text-xs font-medium text-primary">
                  {story.product}
                </p>
              </blockquote>
            </StaggerItem>
          ))}
        </Stagger>
      </PageContainer>
    </section>
  );
}
