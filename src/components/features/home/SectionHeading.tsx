import type { ReactNode } from "react";
import { FadeIn } from "@/components/shared/motion";
import { cn } from "@/lib/utils/cn";

interface SectionHeadingProps {
  eyebrow: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  align?: "left" | "center";
  tone?: "light" | "dark";
  className?: string;
}

/** Shared heading block for landing page sections (eyebrow, title, copy, optional action). */
export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  align = "left",
  tone = "light",
  className,
}: SectionHeadingProps) {
  const centered = align === "center";
  const onDark = tone === "dark";

  return (
    <FadeIn
      className={cn(
        "mb-10 flex flex-col gap-5 md:mb-12",
        centered
          ? "mx-auto max-w-2xl items-center text-center"
          : "md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className={cn(centered ? "flex flex-col items-center" : "max-w-2xl")}>
        <p className={cn("eyebrow", onDark && "text-accent")}>
          <span aria-hidden className={cn("h-px w-6", onDark ? "bg-accent/70" : "bg-accent-strong/60")} />
          {eyebrow}
        </p>
        <h2
          className={cn(
            "mt-3 font-display text-3xl leading-[1.12] sm:text-4xl lg:text-[3.25rem]",
            onDark ? "text-white" : "text-dark",
          )}
        >
          {title}
        </h2>
        {description ? (
          <p
            className={cn(
              "mt-4 max-w-xl text-base leading-relaxed",
              onDark ? "text-cream/80" : "text-muted",
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </FadeIn>
  );
}
