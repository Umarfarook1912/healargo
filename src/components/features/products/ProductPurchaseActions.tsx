import { ShoppingCart, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductShare } from "@/components/features/products/ProductShare";
import { WhatsAppIcon } from "@/components/features/products/ProductShareIcons";
import { QuantityStepper } from "@/components/features/products/QuantityStepper";
import { trackAndOpenWhatsApp } from "@/components/shared/TrackedWhatsAppLink";
import { CATALOG_COPY } from "@/constants/catalog";
import { CHECKOUT_COPY } from "@/constants/checkout";
import {
  buildProductWhatsAppMessage,
  buildWhatsAppUrl,
} from "@/lib/utils/whatsapp";
import { formatInr } from "@/lib/utils/format";
import { WhatsAppLeadContext } from "@/types/whatsapp-lead";

export function ProductPurchaseActions({
  available,
  quantity,
  onQuantity,
  onAdd,
  onBuy,
  onWhatsApp,
  productId,
  productName,
  shareText,
  variantLabel,
  unitPrice,
}: {
  available: boolean;
  quantity: number;
  onQuantity: (next: number) => void;
  onAdd: () => void;
  onBuy: () => void;
  onWhatsApp?: () => boolean;
  productId: string;
  productName: string;
  shareText: string;
  variantLabel?: string;
  unitPrice: number;
}) {
  return (
    <>
      {/* Desktop: quantity + actions on one compact row */}
      <div className="mt-5 hidden items-center gap-3 lg:flex">
        <QuantityStepper quantity={quantity} available={available} onQuantity={onQuantity} compact />
        <Button
          variant="outline"
          className="h-11 flex-1 gap-2 border-primary/30 text-sm font-semibold text-primary hover:bg-primary hover:text-primary-foreground"
          onClick={onAdd}
          disabled={!available}
        >
          <ShoppingCart className="h-4 w-4" />
          {available ? CHECKOUT_COPY.ADD_TO_CART : CATALOG_COPY.outOfStock}
        </Button>
        <Button
          className="h-11 flex-1 gap-2 text-sm font-bold bg-primary text-primary-foreground hover:bg-primary-strong shadow-sm"
          onClick={onBuy}
          disabled={!available}
        >
          <Zap className="h-4 w-4" />
          {CHECKOUT_COPY.BUY_NOW}
        </Button>
      </div>

      {/* Mobile / tablet: sticky bottom action bar (the page adds bottom padding so it never covers content) */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_rgba(48,53,43,0.08)] backdrop-blur-lg lg:hidden">
        <div className="mx-auto flex max-w-2xl items-center gap-2.5">
          <div className="min-w-0 shrink-0 pr-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
              {quantity > 1 ? `${quantity} \u00d7 ${formatInr(unitPrice)}` : CATALOG_COPY.priceLabel}
            </p>
            <p className="font-display text-lg font-semibold leading-tight text-primary">
              {formatInr(unitPrice * quantity)}
            </p>
          </div>
          <Button
            variant="outline"
            aria-label={available ? CHECKOUT_COPY.ADD_TO_CART : CATALOG_COPY.outOfStock}
            className="h-11 flex-1 gap-1.5 border-primary/30 px-3 text-primary max-[379px]:w-11 max-[379px]:flex-none max-[379px]:px-0"
            onClick={onAdd}
            disabled={!available}
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="truncate max-[379px]:hidden">
              {available ? CHECKOUT_COPY.ADD_TO_CART : CATALOG_COPY.outOfStock}
            </span>
          </Button>
          <Button
            className="h-11 flex-1 gap-1.5 px-3 bg-primary text-primary-foreground hover:bg-primary-strong font-bold"
            onClick={onBuy}
            disabled={!available}
          >
            <Zap className="h-4 w-4" />
            <span className="truncate">{CHECKOUT_COPY.BUY_NOW}</span>
          </Button>
        </div>
      </div>

      {variantLabel ? (
        <Button
          variant="whatsapp"
          className="mt-3 flex h-11 w-full items-center justify-center gap-2 text-sm font-semibold"
          onClick={() => {
            trackAndOpenWhatsApp({
              href: buildWhatsAppUrl(
                buildProductWhatsAppMessage(
                  productName,
                  variantLabel,
                  unitPrice,
                  quantity,
                ),
              ),
              context: WhatsAppLeadContext.PRODUCT,
              items: [
                {
                  productId,
                  name: productName,
                  variantLabel,
                  quantity,
                  price: unitPrice,
                },
              ],
              estimatedTotal: unitPrice * quantity,
              onBeforeTrack: onWhatsApp,
            });
          }}
        >
          <WhatsAppIcon className="h-4 w-4 text-white" />
          <span className="truncate">Chat on WhatsApp</span>
        </Button>
      ) : null}
      <div className="mt-3">
        <ProductShare name={productName} text={shareText} />
      </div>
    </>
  );
}