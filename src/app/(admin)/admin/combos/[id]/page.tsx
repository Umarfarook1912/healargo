import { notFound } from "next/navigation";
import { AdminComboForm } from "@/components/features/admin/AdminComboForm";
import { AdminPageHeader } from "@/components/features/admin/AdminUi";
import { mapCombo } from "@/lib/db/catalog";
import { prisma } from "@/lib/db/prisma";

type Params = { params: Promise<{ id: string }> };

export default async function EditComboPage({ params }: Params) {
  const { id } = await params;
  const combo = await prisma.combo.findUnique({ where: { id } });
  if (!combo) notFound();
  return (
    <div>
      <AdminPageHeader title="Edit combo" />
      <AdminComboForm combo={mapCombo(combo)} />
    </div>
  );
}
