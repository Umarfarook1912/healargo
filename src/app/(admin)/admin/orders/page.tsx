import { AdminOrdersClient } from "@/components/features/admin/AdminOrdersClient";
import { mapOrders } from "@/lib/db/orders";
import { normalizeProductVariants } from "@/lib/db/catalog";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const [orders, products] = await Promise.all([
    // All payment states are listed (PENDING/FAILED included, e.g. orders an
    // admin just created); the Payment filter narrows the list.
    prisma.order.findMany({
      include: { items: true, user: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <AdminOrdersClient
      orders={mapOrders(orders)}
      products={products.map((product) => ({
        _id: product.id,
        name: product.name,
        images: product.images,
        variants: normalizeProductVariants(product.variants).map((variant) => ({
          _id: variant._id ?? "",
          label: variant.label,
          price: variant.price,
        })),
      }))}
    />
  );
}
