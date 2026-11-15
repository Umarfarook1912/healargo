"use client";

import { OfferCountdown } from "@/components/features/catalog/OfferCountdown";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScaleOnHover } from "@/components/shared/motion";
import { ASSETS } from "@/constants/assets";
import { CATALOG_COPY } from "@/constants/catalog";
import { CHECKOUT_COPY } from "@/constants/checkout";
import { PRODUCT_COPY } from "@/constants/home";
import { LAYOUT } from "@/constants/layout";
import { ROUTES } from "@/constants/routes";
import { useCartStore } from "@/hooks/useCartStore";
import { useRequireLogin } from "@/hooks/useRequireLogin";
import { VARIANT_AVAILABLE_STOCK, comboIsLive } from "@/lib/products/commerce";
import { formatInr, stripHtml, truncate } from "@/lib/utils/format";
import type { ComboOffer } from "@/types/combo";

export function ComboCard({ combo }: { combo: ComboOffer }) {
  const router = useRouter();
  const { requireLogin } = useRequireLogin();
  const addItem = useCartStore((s) => s.addItem);
  const buyNowItem = useCartStore((s) => s.buyNowItem);
  const name = stripHtml(combo.name);
  const description = truncate(stripHtml(combo.description ?? ""), 80);
  const image = combo.images[0] || ASSETS.PLACEHOLDER_PRODUCT;
  const [imgSrc, setImgSrc] = useState(image);
  const discount =
    combo.originalPrice > combo.price
      ? Math.round(((combo.originalPrice - combo.price) / combo.originalPrice) * 100)
      : 0;

  const summary = combo.items
    .map((item) => `${item.productName ?? "Item"} ${item.variantLabel ?? ""}`.trim())
    .join(", ");

  function getPayload() {
    return {
      productId: combo._id,
      variantId: combo._id,
      slug: combo.slug,
      name,
      variantLabel: summary || CATALOG_COPY.comboChip,
      image: imgSrc,
      price: combo.price,
      originalPrice: combo.originalPrice,
      stock: VARIANT_AVAILABLE_STOCK,
      quantity: 1,
    };
  }

  function handleAdd(e?: React.MouseEvent) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    addItem(getPayload());
    toast.success(CHECKOUT_COPY.ADDED_TO_CART);
  }

  function handleBuyNow(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!requireLogin()) return;
    buyNowItem(getPayload());
    toast.success(CHECKOUT_COPY.BUY_NOW_SUCCESS);
    router.push(ROUTES.CHECKOUT);
  }

  return (
    <ScaleOnHover className="h-full w-full">
      <article className="@container group flex h-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-card p-2 shadow-[var(--shadow-soft)] transition-shadow duration-300 hover:border-primary/25 hover:shadow-[var(--shadow-lifted)] sm:p-2.5">
        <Link
          href={ROUTES.COMBO(combo.slug)}
          className="relative block aspect-square shrink-0 overflow-hidden rounded-xl bg-cream"
        >
          <Image
            src={imgSrc}
            alt={name}
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
        </Link>

        <div className="flex flex-1 flex-col px-0.5 pt-2.5 @min-[13rem]:px-1">
          <Link href={ROUTES.COMBO(combo.slug)}>
            <h3 className="line-clamp-2 min-h-[2.5em] break-words font-sans text-[13px] font-semibold leading-[1.25] text-dark transition-colors group-hover:text-primary @min-[13rem]:text-sm">
              {name}
            </h3>
          </Link>
          <p className="mt-0.5 hidden min-h-4 truncate text-xs text-muted @min-[13rem]:block">
            {description || "\u00a0"}
          </p>
          <div className="mt-2 flex min-h-5 gap-1">
            <span className="inline-flex h-5 items-center rounded-full border border-accent/40 bg-accent-soft px-2 text-[10px] font-semibold leading-none text-accent-strong @min-[13rem]:h-6 @min-[13rem]:px-2.5">
              {CATALOG_COPY.comboChip}
            </span>
          </div>
          <div className="mt-2 flex min-h-5 flex-wrap items-baseline gap-x-1.5">
            <span className="text-sm font-bold leading-tight text-primary @min-[13rem]:text-base">
              {formatInr(combo.price)}
            </span>
            {combo.originalPrice > combo.price ? (
              <span className="text-[11px] leading-tight text-muted line-through @min-[13rem]:text-xs">
                {formatInr(combo.originalPrice)}
              </span>
            ) : null}
          </div>
          {/* Fixed-height slot so cards with and without a countdown stay aligned */}
          <div className="min-h-4 overflow-hidden whitespace-nowrap">
            {combo.endsAt && comboIsLive(combo) ? (
              <OfferCountdown endsAt={combo.endsAt} compact />
            ) : null}
          </div>
          <div className="mt-auto flex gap-1.5 pt-2.5">
            <Button
              size="sm"
              variant="outline"
              aria-label={CHECKOUT_COPY.ADD_TO_CART}
              className="h-9 w-9 shrink-0 border-primary/30 p-0 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground @min-[13rem]:w-auto @min-[13rem]:flex-1 @min-[13rem]:gap-1.5 @min-[13rem]:px-2"
              onClick={handleAdd}
            >
              <ShoppingCart className="h-4 w-4 shrink-0 @min-[13rem]:h-3.5 @min-[13rem]:w-3.5" />
              <span className="hidden @min-[13rem]:inline">{CHECKOUT_COPY.ADD_TO_CART}</span>
            </Button>
            <Button
              size="sm"
              variant="accent"
              className="h-9 min-w-0 flex-1 px-2 text-xs font-semibold transition-colors"
              onClick={handleBuyNow}
            >
              <span className="truncate">{CHECKOUT_COPY.BUY_NOW}</span>
            </Button>
          </div>
        </div>
      </article>
    </ScaleOnHover>
  );
}
