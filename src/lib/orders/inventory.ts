import type { Prisma } from "@prisma/client";
import { mapCombo, mapProducts, normalizeProductVariants } from "@/lib/db/catalog";
import { prisma } from "@/lib/db/prisma";
import {
  comboIsLive,
  sellingPrice,
  variantDisplayImage,
  variantIsAvailable,
} from "@/lib/products/commerce";
import { stripHtml } from "@/lib/utils/format";
import type { OrderItem } from "@/types/order";
import type { ProductVariant } from "@/types/product";

type CartLikeItem = {
  productId: string;
  variantId: string;
  quantity: number;
};

export type ResolvedOrderItem = OrderItem & {
  sku?: string;
  gstExempt?: boolean;
};

export async function resolveOrderItemsFromCatalog(
  items: CartLikeItem[],
): Promise<{ items: ResolvedOrderItem[] } | { error: string }> {
  const productIds = [...new Set(items.map((i) => i.productId))];
  const products = mapProducts(
    await prisma.product.findMany({
      where: {
        id: { in: productIds },
        isActive: true,
      },
    }),
  );

  const byId = new Map(products.map((p) => [p._id, p]));
  const resolved: ResolvedOrderItem[] = [];

  for (const item of items) {
    const product = byId.get(item.productId);
    if (!product) {
      const comboRow = await prisma.combo.findUnique({
        where: { id: item.productId },
      });
      const combo = comboRow ? mapCombo(comboRow) : null;
      if (!combo || !comboIsLive(combo)) {
        return { error: "One or more products are unavailable" };
      }
      const summary = (combo.items ?? [])
        .map(
          (line: { productName?: string; variantLabel?: string; quantity?: number }) =>
            `${line.productName ?? "Item"} ${line.variantLabel ?? ""} × ${line.quantity ?? 1}`.trim(),
        )
        .join(", ");
      resolved.push({
        productId: item.productId,
        variantId: item.variantId,
        name: stripHtml(combo.name),
        variantLabel: summary || "Combo",
        image: combo.images?.[0] ?? "",
        price: combo.price,
        quantity: item.quantity,
        gstExempt: false,
      });
      continue;
    }

    const variant = product.variants.find((v) => String(v._id) === item.variantId);
    if (!variant) {
      return { error: `Variant not found for ${product.name}` };
    }
    if (!variantIsAvailable(variant) || variant.stock < item.quantity) {
      return {
        error: `${product.name} (${variant.label}) is out of stock`,
      };
    }

    const price = sellingPrice(product as {
      offerEnabled?: boolean;
      offerStartsAt?: Date | null;
      offerEndsAt?: Date | null;
    }, {
      ...variant,
      originalPrice: variant.originalPrice ?? variant.price,
    });

    resolved.push({
      productId: item.productId,
      variantId: item.variantId,
      name: product.name,
      variantLabel: variant.label,
      image: variantDisplayImage(product.images, variant),
      price,
      quantity: item.quantity,
      sku: variant.sku,
      gstExempt: Boolean(
        (product as { gstExempt?: boolean | null }).gstExempt,
      ),
    });
  }

  return { items: resolved };
}

type DbClient = Prisma.TransactionClient;

async function decrementOneItem(
  tx: DbClient,
  item: { productId: string; variantId: string; quantity: number },
): Promise<void> {
  const product = await tx.product.findUnique({
    where: { id: item.productId },
    select: { id: true, variants: true },
  });

  if (product) {
    const variants = normalizeProductVariants(product.variants);
    const variantIndex = variants.findIndex((entry) => String(entry._id) === item.variantId);
    if (variantIndex < 0) {
      throw new Error("Failed to reserve stock for one or more items");
    }

    const variant = variants[variantIndex] as ProductVariant;
    if (!variantIsAvailable(variant) || (variant.stock ?? 0) < item.quantity) {
      throw new Error("Failed to reserve stock for one or more items");
    }

    variants[variantIndex] = {
      ...variant,
      stock: (variant.stock ?? 0) - item.quantity,
    };
    await tx.product.update({
      where: { id: item.productId },
      data: { variants: variants as unknown as Prisma.InputJsonValue },
    });
    return;
  }

  const comboRow = await tx.combo.findUnique({
    where: { id: item.productId },
  });
  const combo = comboRow ? mapCombo(comboRow) : null;
  if (!combo) {
    throw new Error("Failed to reserve stock for one or more items");
  }

  for (const line of combo.items ?? []) {
    if (!line.productId || !line.variantId || line.isCustom) continue;
    await decrementOneItem(tx, {
      productId: String(line.productId),
      variantId: String(line.variantId),
      quantity: (line.quantity ?? 1) * item.quantity,
    });
  }
}

export async function decrementStockForItems(
  items: Array<{ productId: string; variantId: string; quantity: number }>,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    for (const item of items) {
      await decrementOneItem(tx, item);
    }
  });
}

export async function restoreStockForItems(
  items: Array<{ productId: string; variantId: string; quantity: number }>,
): Promise<void> {
  for (const item of items) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
      select: { variants: true },
    });
    if (!product) continue;
    const variants = normalizeProductVariants(product.variants);
    const variantIndex = variants.findIndex((entry) => String(entry._id) === item.variantId);
    if (variantIndex < 0) continue;
    const variant = variants[variantIndex];
    variants[variantIndex] = {
      ...variant,
      stock: (variant.stock ?? 0) + item.quantity,
    };
    await prisma.product.update({
      where: { id: item.productId },
      data: { variants: variants as unknown as Prisma.InputJsonValue },
    });
  }
}
