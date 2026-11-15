"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ShoppingBag, Trash2 } from "lucide-react";
import { useCartStore } from "@/hooks/useCartStore";
import { CheckoutButton } from "@/components/features/cart/CheckoutButton";
import { EstimatedDeliveryBadge } from "@/components/features/shipping/EstimatedDeliveryBadge";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { CHECKOUT_COPY } from "@/constants/checkout";
import { ROUTES } from "@/constants/routes";
import { formatInr } from "@/lib/utils/format";

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.getSubtotal());
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  if (items.length === 0) {
    return (
      <PageContainer className="py-16 md:py-24">
        <div className="mx-auto flex max-w-lg flex-col items-center rounded-3xl border border-dashed border-border bg-card/70 px-6 py-14 text-center">
          <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft text-primary ring-1 ring-primary/10">
            <ShoppingBag className="h-7 w-7" />
          </span>
          <h1 className="font-display text-3xl">Your cart is empty</h1>
          <p className="mt-2 text-sm text-muted">
            Discover natural essentials and add your favourites here.
          </p>
          <Button className="mt-6" asChild>
            <Link href={ROUTES.SHOP}>Continue shopping</Link>
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="py-10 md:py-14">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Your basket</p>
          <h1 className="mt-2 font-display text-4xl text-dark md:text-5xl">Cart</h1>
        </div>
        <Link
          href={ROUTES.SHOP}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Continue shopping
        </Link>
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={`${item.productId}-${item.variantId}`}
              className="surface-card flex gap-4 p-4 sm:gap-5 sm:p-5"
            >
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-cream sm:h-28 sm:w-28">
                <Image src={item.image} alt={item.name} fill unoptimized className="object-cover" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="font-display text-lg leading-snug text-dark font-semibold">{item.name}</p>
                <p className="mt-0.5 text-sm text-muted">{item.variantLabel}</p>
                <p className="mt-2 text-base font-bold text-primary">{formatInr(item.price)}</p>
                <div className="mt-auto flex flex-wrap items-center gap-3 pt-3">
                  <label className="flex items-center gap-2 text-xs font-medium text-muted">
                    Qty
                    <input
                      type="number"
                      min={1}
                      max={item.stock}
                      value={item.quantity}
                      className="h-10 w-20 rounded-xl border border-input bg-card px-3 text-sm text-dark focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/12"
                      onChange={(e) =>
                        updateQuantity(
                          item.productId,
                          item.variantId,
                          Number(e.target.value),
                        )
                      }
                    />
                  </label>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-destructive transition hover:bg-destructive-soft"
                    onClick={() => removeItem(item.productId, item.variantId)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <aside className="surface-card space-y-5 p-6 lg:sticky lg:top-28">
          <h2 className="font-display text-2xl">Order summary</h2>
          <EstimatedDeliveryBadge variant="cart" />
          <div className="border-t border-border pt-5">
            <p className="text-lg font-semibold text-dark">Subtotal: {formatInr(subtotal)}</p>
            <p className="mt-1 text-xs text-muted">Shipping and coupons are applied at checkout.</p>
          </div>
          <CheckoutButton className="w-full">{CHECKOUT_COPY.PROCEED}</CheckoutButton>
        </aside>
      </div>
    </PageContainer>
  );
}
