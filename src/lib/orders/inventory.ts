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

  // Per-line checks miss the same variant on two lines and combo contents.
  const stockError = await checkStockForItems(items);
  if (stockError) return { error: stockError };

  return { items: resolved };
}

type DbClient = Prisma.TransactionClient | typeof prisma;
type StockLine = { productId: string; variantId: string; quantity: number };

/**
 * Expands combo lines into their product variants and merges duplicates, so the
 * result is the total quantity needed per product variant.
 */
export async function expandStockRequirements(
  items: StockLine[],
  db: DbClient = prisma,
): Promise<{ lines: StockLine[] } | { error: string }> {
  const totals = new Map<string, StockLine>();
  const add = (productId: string, variantId: string, quantity: number) => {
    const key = `${productId}::${variantId}`;
    const current = totals.get(key);
    if (current) current.quantity += quantity;
    else totals.set(key, { productId, variantId, quantity });
  };

  const productIds = [...new Set(items.map((i) => i.productId))];
  const productRows = await db.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true },
  });
  const isProduct = new Set(productRows.map((p) => p.id));

  for (const item of items) {
    if (isProduct.has(item.productId)) {
      add(item.productId, String(item.variantId), item.quantity);
      continue;
    }
    const comboRow = await db.combo.findUnique({ where: { id: item.productId } });
    const combo = comboRow ? mapCombo(comboRow) : null;
    if (!combo) return { error: "One or more products are unavailable" };
    for (const line of combo.items ?? []) {
      if (!line.productId || !line.variantId || line.isCustom) continue;
      add(String(line.productId), String(line.variantId), (line.quantity ?? 1) * item.quantity);
    }
  }

  return { lines: [...totals.values()] };
}

/**
 * Returns an error message when the catalog can't cover the requested
 * quantities (combos expanded, duplicate variants merged), otherwise null.
 */
export async function checkStockForItems(
  items: StockLine[],
  db: DbClient = prisma,
): Promise<string | null> {
  const expanded = await expandStockRequirements(items, db);
  if ("error" in expanded) return expanded.error;

  const ids = [...new Set(expanded.lines.map((l) => l.productId))];
  const products = await db.product.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, variants: true },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  for (const line of expanded.lines) {
    const product = byId.get(line.productId);
    if (!product) return "One or more products are unavailable";
    const variant = normalizeProductVariants(product.variants).find(
      (entry) => String(entry._id) === line.variantId,
    ) as ProductVariant | undefined;
    if (!variant) return `Variant not found for ${product.name}`;
    if (!variantIsAvailable(variant) || (variant.stock ?? 0) < line.quantity) {
      return `${product.name} (${variant.label}) is out of stock`;
    }
  }
  return null;
}

async function decrementOneItem(
  tx: Prisma.TransactionClient,
  item: { productId: string; variantId: string; quantity: number },
): Promise<void> {
  // Row lock so concurrent payments/refunds can't overwrite each other's
  // read-modify-write of the variants JSON.
  await tx.$queryRaw`SELECT id FROM products WHERE id = ${item.productId} FOR UPDATE`;
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
    await decrementStockInTx(tx, items);
  });
}

export async function decrementStockInTx(
  tx: Prisma.TransactionClient,
  items: Array<{ productId: string; variantId: string; quantity: number }>,
): Promise<void> {
  for (const item of items) {
    await decrementOneItem(tx, item);
  }
}

async function restoreOneItem(
  tx: Prisma.TransactionClient,
  item: { productId: string; variantId: string; quantity: number },
): Promise<void> {
  // Row lock so concurrent payments/refunds can't overwrite each other's
  // read-modify-write of the variants JSON.
  await tx.$queryRaw`SELECT id FROM products WHERE id = ${item.productId} FOR UPDATE`;
  const product = await tx.product.findUnique({
    where: { id: item.productId },
    select: { variants: true },
  });

  if (product) {
    const variants = normalizeProductVariants(product.variants);
    const variantIndex = variants.findIndex((entry) => String(entry._id) === item.variantId);
    if (variantIndex < 0) return;
    const variant = variants[variantIndex];
    variants[variantIndex] = {
      ...variant,
      stock: (variant.stock ?? 0) + item.quantity,
    };
    await tx.product.update({
      where: { id: item.productId },
      data: { variants: variants as unknown as Prisma.InputJsonValue },
    });
    return;
  }

  // Combo line: put back each product variant it contains.
  const comboRow = await tx.combo.findUnique({ where: { id: item.productId } });
  const combo = comboRow ? mapCombo(comboRow) : null;
  if (!combo) return;
  for (const line of combo.items ?? []) {
    if (!line.productId || !line.variantId || line.isCustom) continue;
    await restoreOneItem(tx, {
      productId: String(line.productId),
      variantId: String(line.variantId),
      quantity: (line.quantity ?? 1) * item.quantity,
    });
  }
}

export async function restoreStockForItems(
  items: Array<{ productId: string; variantId: string; quantity: number }>,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    for (const item of items) {
      await restoreOneItem(tx, item);
    }
  });
}

/**
 * Puts an order's stock back exactly once: the `stockDecremented` flag is
 * cleared with a conditional update in the same transaction, so a second
 * cancel/refund/delete (or a concurrent one) restores nothing.
 */
export async function restoreStockForOrder(orderId: string): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const claimed = await tx.order.updateMany({
      where: { id: orderId, stockDecremented: true },
      data: { stockDecremented: false },
    });
    if (claimed.count === 0) return false;
    const items = await tx.orderItem.findMany({ where: { orderId } });
    for (const item of items) {
      await restoreOneItem(tx, {
        productId: item.productId,
        variantId: String(item.variantId),
        quantity: item.quantity,
      });
    }
    return true;
  });
}
