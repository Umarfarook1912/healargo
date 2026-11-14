import { mapCombo, mapProducts } from "@/lib/db/catalog";
import { prisma } from "@/lib/db/prisma";
import {
  comboIsLive,
  sellingPrice,
  variantDisplayImage,
} from "@/lib/products/commerce";
import type { ComboLineDetail, ComboOffer } from "@/types/combo";
import type { Product } from "@/types/product";

export async function getComboBySlug(slug: string): Promise<{
  combo: ComboOffer;
  lines: ComboLineDetail[];
  separateTotal: number;
} | null> {
  const cleanSlug = decodeURIComponent(slug).trim();
  let found = await prisma.combo.findFirst({
    where: { slug: { equals: cleanSlug, mode: "insensitive" } },
  });
  if (!found) {
    const allCombos = await prisma.combo.findMany({ where: { isActive: true } });
    const target = cleanSlug.toLowerCase();
    const tokens = target.split(/[-_\s]+/).filter((t) => t.length > 2);
    found =
      allCombos.find((c) => {
        const cSlug = (c.slug || "").toLowerCase();
        return cSlug && (target.includes(cSlug) || cSlug.includes(target));
      }) ||
      allCombos.find((c) => {
        const cSlug = (c.slug || "").toLowerCase();
        const cName = (c.name || "").toLowerCase();
        return tokens.some((t) => cSlug.includes(t) || cName.includes(t));
      }) ||
      null;
  }
  if (!found) return null;
  const combo = mapCombo(found);
  if (!comboIsLive(combo)) return null;

  const ids = combo.items
    .map((item) => item.productId)
    .filter((id): id is string => Boolean(id));
  const products = ids.length
    ? mapProducts(
        await prisma.product.findMany({
          where: { id: { in: ids } },
          orderBy: { createdAt: "desc" },
        }),
      )
    : [];
  const byId = new Map(products.map((product) => [product._id, product]));

  const lines = combo.items.map((item, index) => {
    const product = item.productId ? byId.get(String(item.productId)) : undefined;
    const variant = product?.variants.find(
      (entry) => String(entry._id) === String(item.variantId),
    );
    const custom = Boolean(item.isCustom || !product || !variant);
    const unitPrice = custom
      ? item.customPrice ?? (product && variant ? sellingPrice(product, variant) : 0)
      : product && variant
        ? sellingPrice(product, variant)
        : 0;
    return {
      key: `${item.productId ?? "custom"}-${item.variantId ?? index}`,
      name: item.productName || product?.name || "Item",
      label: item.variantLabel || variant?.label || "",
      quantity: item.quantity,
      unitPrice,
      image: custom
        ? item.customImage || (variant ? variantDisplayImage(product?.images, variant) : product?.images?.[0] || "")
        : variantDisplayImage(product?.images, variant),
    };
  });

  const separateTotal = lines.reduce(
    (sum, line) => sum + line.unitPrice * line.quantity,
    0,
  );
  return { combo, lines, separateTotal };
}
