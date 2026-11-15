import { Badge } from "@/components/ui/badge";
import type { ProductDetailHeadingProps } from "@/types/product";

export function ProductDetailHeading({
  name,
  shortDescription,
  discount,
}: ProductDetailHeadingProps) {
  return (
    <div>
      {discount > 0 ? (
        <Badge className="mb-2.5 border-transparent bg-primary px-2.5 text-[11px] text-primary-foreground lg:hidden">
          -{discount}% OFF
        </Badge>
      ) : null}
      <h1 className="font-display text-2xl leading-tight text-dark sm:text-[1.75rem] lg:text-[1.9rem] xl:text-[2.15rem]">
        {name}
      </h1>
      {shortDescription ? (
        <p className="mt-2 text-sm leading-relaxed text-muted lg:text-[15px]">
          {shortDescription}
        </p>
      ) : null}
    </div>
  );
}