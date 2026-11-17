import Image from "next/image";
import { PageContainer } from "@/components/layout/PageContainer";
import { ASSETS } from "@/constants/assets";
import { cn } from "@/lib/utils/cn";

/**
 * Shared vibrant page header band for storefront pages.
 * Matches the flagship Playful Nature 3.0 hero aesthetic with warm ambient gradients,
 * floating illustrations, and editorial Fraunces typography.
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
        "vibrant-gradient relative isolate overflow-hidden border-b border-[#263D2E]/10 py-10 sm:py-14 md:py-18",
        className,
      )}
    >
      {/* Playful Floating SVG Elements */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-2 top-8 -z-10 h-9 w-9 opacity-80 animate-float sm:left-8 sm:h-11 sm:w-11"
      >
        <Image
          src={ASSETS.ILLUSTRATIONS.LEAF}
          alt=""
          width={44}
          height={44}
          className="h-full w-full object-contain drop-shadow-sm"
        />
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute right-4 top-6 -z-10 h-8 w-8 opacity-75 animate-spin-slow sm:right-12 sm:h-10 sm:w-10"
      >
        <Image
          src={ASSETS.ILLUSTRATIONS.SPARKLE}
          alt=""
          width={40}
          height={40}
          className="h-full w-full object-contain drop-shadow-sm"
        />
      </div>

      {/* Sunny organic ambient blooms */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-16 top-0 -z-20 h-64 w-64 rounded-full bg-[#FFD45A]/30 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 bottom-0 -z-20 h-72 w-72 rounded-full bg-[#8EDBD0]/35 blur-3xl"
      />

      <PageContainer
        className={cn(
          "relative",
          align === "center" && "text-center",
        )}
      >
        <div className={cn("max-w-3xl", align === "center" && "mx-auto")}>
          {eyebrow ? (
            <div className={cn("mb-3.5", align === "center" && "flex justify-center")}>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#4F8A45]/30 bg-white/90 px-3.5 py-1 text-xs font-extrabold uppercase tracking-[0.16em] text-[#4F8A45] shadow-xs backdrop-blur">
                {eyebrow}
              </span>
            </div>
          ) : null}
          <h1
            className={cn(
              "font-display text-3xl font-normal leading-[1.12] tracking-tight text-[#263D2E] sm:text-4xl md:text-5xl lg:text-6xl",
              eyebrow ? "mt-2" : null,
            )}
          >
            {title}
          </h1>
          {description ? (
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#72776A] sm:text-lg">
              {description}
            </p>
          ) : null}
        </div>
        {children ? <div className="mt-8">{children}</div> : null}
      </PageContainer>
    </section>
  );
}
