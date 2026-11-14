import { comboIsLive, offerIsLive } from "@/lib/products/commerce";
import { mapCombos, mapProducts } from "@/lib/db/catalog";
import { prisma } from "@/lib/db/prisma";
import type { ComboOffer } from "@/types/combo";
import type { Product } from "@/types/product";

export async function getLiveOffers(): Promise<Product[]> {
  const products = mapProducts(
    await prisma.product.findMany({
      where: { isActive: true, offerEnabled: true },
      orderBy: { createdAt: "desc" },
    }),
  );
  return products.filter((product) => offerIsLive(product));
}

export async function getLiveCombos(): Promise<ComboOffer[]> {
  const combos = mapCombos(
    await prisma.combo.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    }),
  );
  return combos.filter((combo) => comboIsLive(combo));
}
