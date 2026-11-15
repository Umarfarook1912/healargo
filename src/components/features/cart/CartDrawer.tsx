"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckoutButton } from "@/components/features/cart/CheckoutButton";
import { EstimatedDeliveryBadge } from "@/components/features/shipping/EstimatedDeliveryBadge";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { CHECKOUT_COPY } from "@/constants/checkout";
import { useCartStore } from "@/hooks/useCartStore";
import { useRequireLogin } from "@/hooks/useRequireLogin";
import { trackAndOpenWhatsApp } from "@/components/shared/TrackedWhatsAppLink";
import { formatInr } from "@/lib/utils/format";
import {
  buildCartWhatsAppMessage,
  buildWhatsAppUrl,
} from "@/lib/utils/whatsapp";
import { WhatsAppLeadContext } from "@/types/whatsapp-lead";

export function CartDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const subtotal = useCartStore((s) => s.getSubtotal());
  const { requireLogin } = useRequireLogin();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Your Cart</DialogTitle>
        </DialogHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <span className="mb-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft text-primary ring-1 ring-primary/10">
              <ShoppingBag className="h-7 w-7" />
            </span>
            <p className="font-display text-xl text-dark">{CHECKOUT_COPY.EMPTY_CART}</p>
            <p className="text-sm text-muted">
              Add pure oils & ghee to get started
            </p>
            <Button asChild onClick={() => onOpenChange(false)}>
              <Link href={ROUTES.SHOP}>Shop Now</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="-mx-1 flex-1 space-y-3 overflow-y-auto px-1">
              {items.map((item) => (
                <div
                  key={`${item.productId}-${item.variantId}`}
                  className="flex gap-3 rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-soft)]"
                >
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-cream">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-snug text-dark">{item.name}</p>
                    <p className="text-xs text-muted">{item.variantLabel}</p>
                    <p className="mt-1 text-sm font-bold text-primary">
                      {formatInr(item.price)}
                    </p>
                    <div className="mt-2 flex items-center gap-1">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card transition hover:border-primary/40 hover:text-primary"
                        onClick={() =>
                          updateQuantity(
                            item.productId,
                            item.variantId,
                            item.quantity - 1,
                          )
                        }
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-7 text-center text-sm font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card transition hover:border-primary/40 hover:text-primary"
                        onClick={() =>
                          updateQuantity(
                            item.productId,
                            item.variantId,
                            item.quantity + 1,
                          )
                        }
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="ml-auto flex h-8 w-8 items-center justify-center rounded-full text-destructive transition hover:bg-destructive-soft"
                        aria-label="Remove item"
                        onClick={() =>
                          removeItem(item.productId, item.variantId)
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-auto space-y-3 border-t border-border pt-5">
              <EstimatedDeliveryBadge variant="cart" />
              <div className="flex items-baseline justify-between text-base font-semibold text-dark">
                <span>Subtotal</span>
                <span className="font-display text-xl text-primary">{formatInr(subtotal)}</span>
              </div>
              <CheckoutButton
                className="w-full"
                onBeforeNavigate={() => onOpenChange(false)}
              >
                {CHECKOUT_COPY.CHECKOUT}
              </CheckoutButton>
              <Button
                variant="whatsapp"
                className="w-full"
                onClick={() => {
                  trackAndOpenWhatsApp({
                    href: buildWhatsAppUrl(
                      buildCartWhatsAppMessage(items, subtotal),
                    ),
                    context: WhatsAppLeadContext.CART,
                    items: items.map((item) => ({
                      productId: item.productId,
                      name: item.name,
                      variantLabel: item.variantLabel,
                      quantity: item.quantity,
                      price: item.price,
                    })),
                    estimatedTotal: subtotal,
                    onBeforeTrack: requireLogin,
                  });
                }}
              >
                {CHECKOUT_COPY.WHATSAPP_CTA}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
