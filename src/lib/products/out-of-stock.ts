import { variantIsAvailable } from "@/lib/products/commerce";
import { mapProducts } from "@/lib/db/catalog";
import { prisma } from "@/lib/db/prisma";

type StockVariant = {
  label: string;
  price?: number;
  originalPrice?: number;
  available?: boolean;
  stock?: number;
};

export async function getOutOfStockProducts(limit = 5) {
  const candidates = mapProducts(
    await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    }),
  );

  return candidates
    .map((product) => {
      const labels = ((product.variants ?? []) as StockVariant[])
        .filter(
          (variant) =>
            !variantIsAvailable({
              price: variant.price ?? 0,
              originalPrice: variant.originalPrice ?? 0,
              available: variant.available,
              stock: variant.stock,
            }),
        )
        .map((variant) => variant.label);
      return { id: product._id, name: product.name, labels };
    })
    .filter((product) => product.labels.length)
    .slice(0, limit);
}
