"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OfferCountdown } from "@/components/features/catalog/OfferCountdown";
import { ScaleOnHover } from "@/components/shared/motion";
import { CATALOG_COPY } from "@/constants/catalog";
import { CHECKOUT_COPY } from "@/constants/checkout";
import { PRODUCT_COPY } from "@/constants/home";
import { ROUTES } from "@/constants/routes";
import { ASSETS } from "@/constants/assets";
import { LAYOUT } from "@/constants/layout";
import { useCartStore } from "@/hooks/useCartStore";
import { useRequireLogin } from "@/hooks/useRequireLogin";
import { cn } from "@/lib/utils/cn";
import { formatInr } from "@/lib/utils/format";
import {
  compareAtPrice,
  sellingPrice,
  variantDisplayImage,
  offerIsLive,
  variantIsAvailable,
} from "@/lib/products/commerce";
import { getProductImageUrl } from "@/lib/utils/image";
import type { ProductCardProps } from "@/types/product";

export function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const { requireLogin } = useRequireLogin();
  const addItem = useCartStore((s) => s.addItem);
  const buyNowItem = useCartStore((s) => s.buyNowItem);
  const [variantIndex, setVariantIndex] = useState(0);
  const variant = product.variants[variantIndex] ?? product.variants[0];
  const unitPrice = variant ? sellingPrice(product, variant) : 0;
  const strikePrice = variant ? compareAtPrice(product, variant) : 0;
  const available = variant ? variantIsAvailable(variant) : false;
  const displayImage = variant
    ? variantDisplayImage(product.images, variant, getProductImageUrl(product))
    : getProductImageUrl(product);
  const [imgSrc, setImgSrc] = useState(displayImage);

  useEffect(() => {
    setImgSrc(displayImage);
  }, [displayImage]);

  const discount =
    strikePrice > unitPrice
      ? Math.round(((strikePrice - unitPrice) / strikePrice) * 100)
      : 0;

  function handleAdd(e?: React.MouseEvent) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!variant || !available) {
      toast.error(CATALOG_COPY.outOfStock);
      return;
    }
    addItem({
      productId: product._id,
      variantId: String(variant._id),
      slug: product.slug,
      name: product.name,
      variantLabel: variant.label,
      image: imgSrc,
      price: unitPrice,
      originalPrice: strikePrice,
      stock: variant.stock,
      gstExempt: Boolean(product.gstExempt),
    });
    toast.success(CHECKOUT_COPY.ADDED_TO_CART);
  }

  function handleBuyNow(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!variant || !available) {
      toast.error(CATALOG_COPY.outOfStock);
      return;
    }
    if (!requireLogin()) return;
    buyNowItem({
      productId: product._id,
      variantId: String(variant._id),
      slug: product.slug,
      name: product.name,
      variantLabel: variant.label,
      image: imgSrc,
      price: unitPrice,
      originalPrice: strikePrice,
      stock: variant.stock,
      quantity: 1,
      gstExempt: Boolean(product.gstExempt),
    });
    toast.success(CHECKOUT_COPY.BUY_NOW_SUCCESS);
    router.push(ROUTES.CHECKOUT);
  }

  return (
    <ScaleOnHover className="h-full w-full">
      <article className="@container group flex h-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-card p-2 shadow-[var(--shadow-soft)] transition-shadow duration-300 hover:border-primary/25 hover:shadow-[var(--shadow-lifted)] sm:p-2.5">
        <Link
          href={ROUTES.PRODUCT(product.slug)}
          className="relative block aspect-square shrink-0 overflow-hidden rounded-xl bg-cream"
        >
          <Image
            src={imgSrc}
            alt={product.name}
            fill
            unoptimized
            onError={() => setImgSrc(ASSETS.PLACEHOLDER_PRODUCT)}
            className={LAYOUT.productImage}
          />
          {discount > 0 ? (
            <Badge className="absolute left-1.5 top-1.5 border-transparent bg-primary px-1.5 py-0 text-[9px] font-semibold leading-4 text-primary-foreground shadow-sm @min-[13rem]:left-2 @min-[13rem]:top-2 @min-[13rem]:px-2 @min-[13rem]:text-[10px]">
              -{discount}
              {PRODUCT_COPY.offSuffix}
            </Badge>
          ) : null}
          {product.isBestSeller ? (
            <Badge className="absolute right-1.5 top-1.5 border-transparent bg-accent px-1.5 py-0 text-[9px] font-semibold leading-4 text-accent-foreground shadow-sm @min-[13rem]:right-2 @min-[13rem]:top-2 @min-[13rem]:px-2 @min-[13rem]:text-[10px]">
              {PRODUCT_COPY.bestSeller}
            </Badge>
          ) : null}
        </Link>

        <div className="flex flex-1 flex-col px-0.5 pt-2.5 @min-[13rem]:px-1">
          <Link href={ROUTES.PRODUCT(product.slug)}>
            <h3 className="line-clamp-2 min-h-[2.5em] break-words font-sans text-[13px] font-semibold leading-[1.25] text-dark transition-colors group-hover:text-primary @min-[13rem]:text-sm">
              {product.name}
            </h3>
          </Link>
          <p className="mt-0.5 hidden min-h-4 truncate text-xs text-muted @min-[13rem]:block">
            {product.shortDescription || "\u00a0"}
          </p>

          <div className="mt-2 flex min-h-5 gap-1 overflow-x-auto [scrollbar-width:none] @min-[13rem]:flex-wrap @min-[13rem]:overflow-visible">
            {product.variants.map((v, index) => (
              <button
                key={v.sku}
                type="button"
                onClick={() => setVariantIndex(index)}
                className={cn(
                  "h-5 shrink-0 rounded-full border px-2 text-[10px] font-medium leading-none transition-colors @min-[13rem]:h-6 @min-[13rem]:px-2.5",
                  index === variantIndex
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-cream/60 text-dark hover:border-primary/50 hover:bg-primary-soft",
                )}
              >
                {v.label}
              </button>
            ))}
          </div>

          <div className="mt-2 flex min-h-5 flex-wrap items-baseline gap-x-1.5">
            {variant ? (
              <>
                <span className="text-sm font-bold leading-tight text-primary @min-[13rem]:text-base">
                  {formatInr(unitPrice)}
                </span>
                {strikePrice > unitPrice ? (
                  <span className="text-[11px] leading-tight text-muted line-through @min-[13rem]:text-xs">
                    {formatInr(strikePrice)}
                  </span>
                ) : null}
              </>
            ) : null}
          </div>
          {/* Fixed-height slot so cards with and without a countdown stay aligned */}
          <div className="min-h-4 overflow-hidden whitespace-nowrap">
            {offerIsLive(product) && product.offerEndsAt ? (
              <OfferCountdown endsAt={product.offerEndsAt} compact />
            ) : null}
          </div>

          <div className="mt-auto flex gap-1.5 pt-2.5">
            <Button
              size="sm"
              variant="outline"
              aria-label={CHECKOUT_COPY.ADD_TO_CART}
              className="h-9 w-9 shrink-0 border-primary/30 p-0 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground @min-[13rem]:w-auto @min-[13rem]:flex-1 @min-[13rem]:gap-1.5 @min-[13rem]:px-2"
              onClick={handleAdd}
              disabled={!variant || !available}
            >
              <ShoppingCart className="h-4 w-4 shrink-0 @min-[13rem]:h-3.5 @min-[13rem]:w-3.5" />
              <span className="hidden @min-[13rem]:inline">{CHECKOUT_COPY.ADD_TO_CART}</span>
            </Button>
            <Button
              size="sm"
              variant="accent"
              className="h-9 min-w-0 flex-1 px-2 text-xs font-semibold transition-colors"
              onClick={handleBuyNow}
              disabled={!variant || !available}
            >
              <span className="truncate">{CHECKOUT_COPY.BUY_NOW}</span>
            </Button>
          </div>
        </div>
      </article>
    </ScaleOnHover>
  );
}
