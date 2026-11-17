import { Badge } from "@/components/ui/badge";
import type { ProductDetailHeadingProps } from "@/types/product";

export function ProductDetailHeading({
  name,
  shortDescription,
  discount,
}: ProductDetailHeadingProps) {
  const cleanName = name
    .replace(/^VS\s+/i, "HEALARGO ")
    .replace(/wooden pressed/i, "Cold Pressed");

  return (
    <div>
      {discount > 0 ? (
        <Badge className="mb-2.5 border-transparent bg-[#FF8066] px-2.5 py-0.5 text-[11px] font-extrabold text-white lg:hidden shadow-xs">
          -{discount}% OFF
        </Badge>
      ) : null}
      <h1 className="font-display text-2xl leading-tight text-dark sm:text-[1.75rem] lg:text-[1.9rem] xl:text-[2.15rem]">
        {cleanName}
      </h1>
      {shortDescription ? (
        <p className="mt-2 text-sm leading-relaxed text-muted lg:text-[15px]">
          {shortDescription}
        </p>
      ) : null}
    </div>
  );
}