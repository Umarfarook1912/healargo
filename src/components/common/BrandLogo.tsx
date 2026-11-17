import Link from "next/link";
import Image from "next/image";
import { ASSETS } from "@/constants/assets";
import { ROUTES } from "@/constants/routes";
import { UI } from "@/constants/ui";
import { cn } from "@/lib/utils/cn";

export type BrandLogoVariant =
  | "default"
  | "horizontal"
  | "light"
  | "horizontal-light"
  | "emblem";

export type BrandLogoSize = "sm" | "md" | "lg" | "xl" | "header" | "footer";

export interface BrandLogoProps {
  variant?: BrandLogoVariant;
  size?: BrandLogoSize;
  href?: string | null;
  priority?: boolean;
  className?: string;
  imgClassName?: string;
}

const SRC_MAP: Record<BrandLogoVariant, string> = {
  default: ASSETS.LOGO,
  horizontal: ASSETS.LOGO_HORIZONTAL,
  light: ASSETS.LOGO_LIGHT,
  "horizontal-light": ASSETS.LOGO_HORIZONTAL_LIGHT,
  emblem: ASSETS.EMBLEM,
};

const SIZE_MAP: Record<BrandLogoSize, Record<BrandLogoVariant, { w: number; h: number; cls: string }>> = {
  sm: {
    default: { w: 140, h: 96, cls: "h-9 w-auto" },
    horizontal: { w: 200, h: 59, cls: "h-7 w-auto" },
    light: { w: 140, h: 96, cls: "h-9 w-auto" },
    "horizontal-light": { w: 200, h: 59, cls: "h-7 w-auto" },
    emblem: { w: 64, h: 64, cls: "h-8 w-8" },
  },
  md: {
    default: { w: 180, h: 123, cls: "h-12 w-auto" },
    horizontal: { w: 270, h: 80, cls: "h-9 w-auto" },
    light: { w: 180, h: 123, cls: "h-12 w-auto" },
    "horizontal-light": { w: 270, h: 80, cls: "h-9 w-auto" },
    emblem: { w: 96, h: 96, cls: "h-12 w-12" },
  },
  lg: {
    default: { w: 240, h: 164, cls: "h-16 w-auto" },
    horizontal: { w: 340, h: 101, cls: "h-12 w-auto" },
    light: { w: 240, h: 164, cls: "h-16 w-auto" },
    "horizontal-light": { w: 340, h: 101, cls: "h-12 w-auto" },
    emblem: { w: 128, h: 128, cls: "h-16 w-16" },
  },
  xl: {
    default: { w: 300, h: 205, cls: "h-20 w-auto" },
    horizontal: { w: 420, h: 124, cls: "h-14 w-auto" },
    light: { w: 300, h: 205, cls: "h-20 w-auto" },
    "horizontal-light": { w: 420, h: 124, cls: "h-14 w-auto" },
    emblem: { w: 160, h: 160, cls: "h-20 w-20" },
  },
  header: {
    default: { w: 210, h: 144, cls: "h-12 w-auto sm:h-14 md:h-15" },
    horizontal: { w: 320, h: 95, cls: "h-10 w-auto sm:h-11 md:h-12" },
    light: { w: 210, h: 144, cls: "h-12 w-auto sm:h-14 md:h-15" },
    "horizontal-light": { w: 320, h: 95, cls: "h-10 w-auto sm:h-11 md:h-12" },
    emblem: { w: 80, h: 80, cls: "h-10 w-10 sm:h-12 sm:w-12" },
  },
  footer: {
    default: { w: 240, h: 164, cls: "h-16 w-auto sm:h-20" },
    horizontal: { w: 360, h: 107, cls: "h-12 w-auto sm:h-14" },
    light: { w: 240, h: 164, cls: "h-16 w-auto sm:h-20" },
    "horizontal-light": { w: 360, h: 107, cls: "h-12 w-auto sm:h-14" },
    emblem: { w: 120, h: 120, cls: "h-14 w-14 sm:h-16 sm:w-16" },
  },
};

export function BrandLogo({
  variant = "default",
  size = "md",
  href = ROUTES.HOME,
  priority = false,
  className,
  imgClassName,
}: BrandLogoProps) {
  const src = SRC_MAP[variant];
  const { w, h, cls } = SIZE_MAP[size][variant];

  const img = (
    <Image
      src={src}
      alt={`${UI.brand} Logo`}
      width={w}
      height={h}
      priority={priority}
      unoptimized
      className={cn("object-contain transition-transform duration-300", cls, imgClassName)}
    />
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          "inline-flex shrink-0 items-center transition-opacity hover:opacity-95 group",
          className,
        )}
        aria-label={`${UI.brand} Home`}
      >
        {img}
      </Link>
    );
  }

  return <div className={cn("inline-flex shrink-0 items-center", className)}>{img}</div>;
}
