import { PageContainer } from "@/components/layout/PageContainer";
import { cn } from "@/lib/utils/cn";

/**
 * Shared page header band for storefront pages.
 * Visual only: renders the page <h1>, an optional eyebrow and description.
 */
export function PageHero({
  title,
  eyebrow,
  description,
  children,
  align = "left",
  className,
}: {
  title: React.ReactNode;
  eyebrow?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <section
      className={cn(
        "herbal-gradient relative overflow-hidden border-b border-border/70",
        className,
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border border-accent/20"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full border border-primary/10"
      />
      <PageContainer
        className={cn(
          "relative py-10 md:py-14",
          align === "center" && "text-center",
        )}
      >
        <div className={cn("max-w-3xl", align === "center" && "mx-auto")}>
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h1
            className={cn(
              "font-display text-4xl leading-tight text-dark md:text-5xl",
              eyebrow ? "mt-3" : null,
            )}
          >
            {title}
          </h1>
          {description ? (
            <p className="mt-3 text-base leading-relaxed text-muted md:text-lg">
              {description}
            </p>
          ) : null}
        </div>
        {children ? <div className="mt-6">{children}</div> : null}
      </PageContainer>
    </section>
  );
}
