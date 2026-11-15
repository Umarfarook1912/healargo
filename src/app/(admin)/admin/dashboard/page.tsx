import Link from "next/link";
import {
  AlertTriangle,
  IndianRupee,
  Package,
  ShoppingBag,
  Users,
} from "lucide-react";
import { AdminTrafficSources } from "@/components/features/admin/AdminTrafficSources";
import {
  AdminCard,
  AdminPageHeader,
  AdminStatCard,
} from "@/components/features/admin/AdminUi";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Button } from "@/components/ui/button";
import { ADMIN_DASHBOARD_COPY, ADMIN_ORDERS_COPY } from "@/constants/admin";
import { ROUTES } from "@/constants/routes";
import { mapOrders } from "@/lib/db/orders";
import { prisma } from "@/lib/db/prisma";
import { getOutOfStockProducts } from "@/lib/products/out-of-stock";
import { formatInr } from "@/lib/utils/format";
import { PaymentStatus } from "@/types/order";
import type { OrderPricing } from "@/types/order";
import type { ShippingAddress } from "@/types/user";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [orderCount, productCount, userCount, paidOrders, recentOrderRows] =
    await Promise.all([
      prisma.order.count(),
      prisma.product.count(),
      prisma.user.count(),
      prisma.order.findMany({
        where: { paymentStatus: PaymentStatus.PAID },
        select: { pricing: true },
      }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { items: true, user: true },
      }),
    ]);

  const revenue = paidOrders.reduce((sum, order) => {
    const pricing = order.pricing as unknown as OrderPricing | null;
    return sum + (pricing?.total ?? 0);
  }, 0);
  const recentOrders = mapOrders(recentOrderRows);
  const outOfStock = await getOutOfStockProducts();

  return (
    <div>
      <AdminPageHeader
        title="Dashboard"
        description="Track sales and fulfillment at a glance."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href={ROUTES.ADMIN.ORDERS}>Manage orders</Link>
            </Button>
            <Button asChild>
              <Link href={ROUTES.ADMIN.PRODUCT_NEW}>Add product</Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Orders"
          value={String(orderCount)}
          hint="All-time orders"
          tone="primary"
          icon={<ShoppingBag className="h-5 w-5" />}
        />
        <AdminStatCard
          label="Products"
          value={String(productCount)}
          hint="Active catalog items"
          tone="accent"
          icon={<Package className="h-5 w-5" />}
        />
        <AdminStatCard
          label="Users"
          value={String(userCount)}
          hint="Registered accounts"
          tone="dark"
          icon={<Users className="h-5 w-5" />}
        />
        <AdminStatCard
          label="Revenue"
          value={formatInr(revenue)}
          hint="Paid orders only"
          tone="muted"
          icon={<IndianRupee className="h-5 w-5" />}
        />
      </div>

      <AdminTrafficSources />

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <AdminCard className="p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl text-dark">Recent orders</h2>
              <p className="text-sm text-muted">Latest checkout activity</p>
            </div>
            <Button size="sm" variant="outline" asChild>
              <Link href={ROUTES.ADMIN.ORDERS}>View all</Link>
            </Button>
          </div>
          {recentOrders.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border bg-cream/50 px-4 py-10 text-center text-sm text-muted">
              No orders yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-[11px] uppercase tracking-[0.14em] text-muted">
                  <tr>
                    <th className="py-3 font-semibold">{ADMIN_ORDERS_COPY.tableCustomer}</th>
                    <th className="py-3 font-semibold">{ADMIN_ORDERS_COPY.tableStatus}</th>
                    <th className="py-3 text-right font-semibold">{ADMIN_ORDERS_COPY.tableTotal}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => {
                    const shipping = order.shippingAddress as ShippingAddress;
                    return (
                      <tr key={order._id} className="border-b border-border/70 transition-colors last:border-0 hover:bg-cream/40">
                        <td className="py-3">
                          <Link href={ROUTES.ADMIN.ORDER_DETAIL(order._id)} className="flex items-center gap-3">
                            <UserAvatar name={shipping.fullName} />
                            <span className="font-medium text-dark">{shipping.fullName}</span>
                          </Link>
                        </td>
                        <td className="py-3">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-cream px-2.5 py-1 text-xs font-medium text-dark/80 ring-1 ring-border">
                            <span
                              className={
                                order.paymentStatus === PaymentStatus.PAID
                                  ? "h-1.5 w-1.5 rounded-full bg-success"
                                  : "h-1.5 w-1.5 rounded-full bg-warning"
                              }
                            />
                            {order.status} · {order.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3 text-right font-semibold text-dark">
                          {formatInr(order.pricing.total)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </AdminCard>

        <AdminCard className="p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning-soft text-warning ring-1 ring-warning/15">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-xl text-dark">
                {ADMIN_DASHBOARD_COPY.outOfStockTitle}
              </h2>
              <p className="text-sm text-muted">{ADMIN_DASHBOARD_COPY.outOfStockHint}</p>
            </div>
          </div>
          {outOfStock.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-success/30 bg-success-soft/60 px-4 py-10 text-center text-sm font-medium text-success">
              {ADMIN_DASHBOARD_COPY.outOfStockEmpty}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-[11px] uppercase tracking-[0.14em] text-muted">
                  <tr>
                    <th className="py-3 font-semibold">{ADMIN_DASHBOARD_COPY.tableProduct}</th>
                    <th className="py-3 text-right font-semibold">{ADMIN_DASHBOARD_COPY.editProduct}</th>
                  </tr>
                </thead>
                <tbody>
                  {outOfStock.map((product) => (
                    <tr key={product.id} className="border-b border-border/70 last:border-0">
                      <td className="py-3">
                        <p className="font-medium text-dark">{product.name}</p>
                        <p className="text-xs text-muted">{product.labels.join(", ")}</p>
                      </td>
                      <td className="py-3 text-right">
                        <Link
                          href={ROUTES.ADMIN.PRODUCT_EDIT(product.id)}
                          className="text-xs font-semibold text-primary hover:underline"
                        >
                          {ADMIN_DASHBOARD_COPY.editProduct}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminCard>
      </div>
    </div>
  );
}
