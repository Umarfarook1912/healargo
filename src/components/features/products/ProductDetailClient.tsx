"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, RotateCcw, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminEditLink } from "@/components/features/products/AdminEditLink";
import { ProductDetailHeading } from "@/components/features/products/ProductDetailHeading";
import { OfferCountdown } from "@/components/features/catalog/OfferCountdown";
import { ProductMediaGallery } from "@/components/features/products/ProductMediaGallery";
import { ProductDetailTabs } from "@/components/features/products/ProductDetailTabs";
import { ProductTrustRow } from "@/components/features/products/ProductTrustRow";
import { ProductPurchaseActions } from "@/components/features/products/ProductPurchaseActions";
import { ProductWhatsAppFloat } from "@/components/features/products/ProductWhatsAppFloat";
import { EstimatedDeliveryBadge } from "@/components/features/shipping/EstimatedDeliveryBadge";
import { QuantityStepper } from "@/components/features/products/QuantityStepper";
import { CATALOG_COPY } from "@/constants/catalog";
import { CHECKOUT_COPY } from "@/constants/checkout";
import { ROUTES } from "@/constants/routes";
import { useCartStore } from "@/hooks/useCartStore";
import { useRequireLogin } from "@/hooks/useRequireLogin";
import {
  compareAtPrice,
  offerIsLive,
  sellingPrice,
  variantDisplayImage,
  variantIsAvailable,
} from "@/lib/products/commerce";
import { cn } from "@/lib/utils/cn";
import { formatInr } from "@/lib/utils/format";
import type { Product } from "@/types/product";

export function ProductDetailClient({ product }: { product: Product }) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const buyNowItem = useCartStore((s) => s.buyNowItem);
  const { requireLogin } = useRequireLogin();
  const [variantIndex, setVariantIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const variant = product.variants[variantIndex];
  const unitPrice = variant ? sellingPrice(product, variant) : 0;
  const strikePrice = variant ? compareAtPrice(product, variant) : 0;
  const available = variant ? variantIsAvailable(variant) : false;
  const image = variantDisplayImage(product.images, variant);

  const discount = useMemo(() => {
    if (!variant || strikePrice <= unitPrice) return 0;
    return Math.round(((strikePrice - unitPrice) / strikePrice) * 100);
  }, [variant, strikePrice, unitPrice]);

  function buildCartPayload() {
    if (!variant) return null;
    return {
      productId: product._id,
      variantId: String(variant._id),
      slug: product.slug,
      name: product.name,
      variantLabel: variant.label,
      image,
      price: unitPrice,
      originalPrice: strikePrice,
      stock: available ? variant.stock : 0,
      quantity,
      gstExempt: Boolean(product.gstExempt),
    };
  }

  function addToCart() {
    if (!available) return toast.error(CATALOG_COPY.outOfStock);
    const payload = buildCartPayload();
    if (!payload) return;
    addItem(payload);
    toast.success(CHECKOUT_COPY.ADDED_TO_CART);
  }

  function buyNow() {
    if (!requireLogin()) return;
    if (!available) return toast.error(CATALOG_COPY.outOfStock);
    const payload = buildCartPayload();
    if (!payload) return;
    buyNowItem(payload);
    toast.success(CHECKOUT_COPY.BUY_NOW_SUCCESS);
    router.push(ROUTES.CHECKOUT);
  }

  const category =
    typeof product.categoryId === "object" ? product.categoryId : undefined;
  const savings = strikePrice > unitPrice ? strikePrice - unitPrice : 0;
  const reviewCount = product.reviewCount ?? 0;
  const averageRating = product.averageRating ?? 0;

  return (
    <div className="pb-28 lg:pb-0">
      <div className="mb-3 flex items-center justify-between gap-3 lg:mb-6">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="-ml-2 gap-1.5 text-muted lg:hidden"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <nav aria-label="Breadcrumb" className="hidden min-w-0 lg:block">
          <ol className="flex min-w-0 items-center gap-1.5 text-[13px] text-muted">
            <li><Link href={ROUTES.HOME} className="transition-colors hover:text-primary">Home</Link></li>
            <li aria-hidden><ChevronRight className="h-3.5 w-3.5" /></li>
            <li><Link href={ROUTES.SHOP} className="transition-colors hover:text-primary">Shop</Link></li>
            {category ? (
              <>
                <li aria-hidden><ChevronRight className="h-3.5 w-3.5" /></li>
                <li>
                  <Link href={ROUTES.CATEGORY(category.slug)} className="transition-colors hover:text-primary">
                    {category.name}
                  </Link>
                </li>
              </>
            ) : null}
            <li aria-hidden><ChevronRight className="h-3.5 w-3.5" /></li>
            <li aria-current="page" className="min-w-0 truncate font-medium text-dark">{product.name}</li>
          </ol>
        </nav>
        <AdminEditLink href={ROUTES.ADMIN.PRODUCT_EDIT(product._id)} />
      </div>

      <div className="grid gap-5 md:grid-cols-2 md:gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1fr)] lg:gap-10 xl:gap-14">
        <div className="mx-auto w-full max-w-md md:max-w-none md:self-start lg:sticky lg:top-28">
          <ProductMediaGallery
            image={image}
            images={product.images}
            videos={product.videos ?? []}
            alt={product.name}
          />
        </div>

        <div className="min-w-0 lg:max-w-[34rem]">
          {category || product.isBestSeller || product.isNewArrival ? (
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {category ? (
                <Link
                  href={ROUTES.CATEGORY(category.slug)}
                  className="eyebrow text-[11px] transition-colors hover:text-primary"
                >
                  {category.name}
                </Link>
              ) : null}
              {product.isBestSeller ? <Badge tone="warning" className="text-[10px]">Best Seller</Badge> : null}
              {product.isNewArrival ? <Badge tone="primary" className="text-[10px]">New Arrival</Badge> : null}
            </div>
          ) : null}

          <ProductDetailHeading
            name={product.name}
            shortDescription={product.shortDescription}
            discount={discount}
          />

          {reviewCount > 0 ? (
            <a href="#product-details" className="mt-2 inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-primary">
              <span className="flex items-center gap-0.5" aria-hidden>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={cn(
                      "h-3.5 w-3.5",
                      n <= Math.round(averageRating) ? "fill-accent text-accent" : "text-border",
                    )}
                  />
                ))}
              </span>
              <span className="font-semibold text-dark">{averageRating.toFixed(1)}</span>
              <span>
                ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
              </span>
            </a>
          ) : null}

          {variant ? (
            <div className="mt-4 border-y border-border py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                    <span className="font-display text-[1.65rem] font-semibold leading-none text-primary lg:text-[1.9rem]">
                      {formatInr(unitPrice)}
                    </span>
                    {strikePrice > unitPrice ? (
                      <span className="text-sm text-muted line-through">{formatInr(strikePrice)}</span>
                    ) : null}
                    {discount > 0 ? (
                      <span className="rounded-md bg-success-soft px-1.5 py-0.5 text-xs font-bold text-success">
                        {discount}% OFF
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted">
                    {savings > 0 ? (
                      <span>
                        You save <span className="font-semibold text-success">{formatInr(savings)}</span>
                      </span>
                    ) : null}
                    {!available ? <Badge tone="destructive">{CATALOG_COPY.outOfStock}</Badge> : null}
                  </div>
                </div>
                <div className="lg:hidden">
                  <QuantityStepper
                    quantity={quantity}
                    available={available}
                    onQuantity={setQuantity}
                    compact
                  />
                </div>
              </div>
              {offerIsLive(product) && product.offerEndsAt ? (
                <div className="mt-3">
                  <OfferCountdown endsAt={product.offerEndsAt} />
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="mt-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
              {CATALOG_COPY.selectSize}
              {variant ? <span className="ml-1.5 normal-case tracking-normal text-dark">{"\u00b7"} {variant.label}</span> : null}
            </p>
            <div className="flex flex-wrap gap-2">
              {product.variants.map((v, index) => (
                <button
                  key={v.sku}
                  type="button"
                  aria-pressed={index === variantIndex}
                  onClick={() => {
                    setVariantIndex(index);
                    setQuantity(1);
                  }}
                  className={cn(
                    "rounded-lg border px-3.5 py-1.5 text-[13px] font-medium transition-colors",
                    index === variantIndex
                      ? "border-primary bg-primary-soft text-primary ring-1 ring-primary"
                      : "border-border bg-card text-dark hover:border-primary/40 hover:bg-primary-soft",
                  )}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          <ProductPurchaseActions
            available={available}
            quantity={quantity}
            onQuantity={setQuantity}
            onAdd={addToCart}
            onBuy={buyNow}
            productId={product._id}
            productName={product.name}
            shareText={product.shortDescription || product.description}
            variantLabel={variant?.label}
            unitPrice={unitPrice}
          />

          <div className="mt-5 space-y-2.5">
            <EstimatedDeliveryBadge variant="product" />
            <p className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-xs text-muted">
              <span className="inline-flex items-center gap-1.5">
                <RotateCcw className="h-3.5 w-3.5 text-primary" />
                Returns as per our
                <Link href={ROUTES.REFUND} className="font-semibold text-primary underline-offset-2 hover:underline">Return &amp; Refund policy</Link>
              </span>
              <Link href={ROUTES.SHIPPING} className="font-semibold text-primary underline-offset-2 hover:underline">Shipping policy</Link>
            </p>
          </div>

          <div className="mt-4">
            <ProductTrustRow />
          </div>
        </div>
      </div>

      <div id="product-details" className="scroll-mt-28">
        <ProductDetailTabs description={product.description} productId={product._id} />
      </div>
      <ProductWhatsAppFloat
        productId={product._id}
        productName={product.name}
        variantLabel={variant?.label}
        unitPrice={unitPrice}
        quantity={quantity}
      />
    </div>
  );
}