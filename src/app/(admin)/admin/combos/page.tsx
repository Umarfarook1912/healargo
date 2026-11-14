import { AdminCombosClient } from "@/components/features/admin/AdminCombosClient";
import { mapCombos } from "@/lib/db/catalog";
import { prisma } from "@/lib/db/prisma";
import type { AdminComboRow } from "@/types/admin-list";

export const dynamic = "force-dynamic";

export default async function AdminCombosPage() {
  const combos = mapCombos(
    await prisma.combo.findMany({ orderBy: { createdAt: "desc" } }),
  ) as AdminComboRow[];

  return <AdminCombosClient combos={combos} />;
}
