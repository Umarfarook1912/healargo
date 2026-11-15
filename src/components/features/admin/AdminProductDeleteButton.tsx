"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ADMIN_ACTIONS } from "@/constants/admin";
import { API_ENDPOINTS } from "@/constants/api";

export function AdminProductDeleteButton({ id }: { id: string }) {
  const router = useRouter();

  async function onDelete() {
    if (!confirm(ADMIN_ACTIONS.confirmDelete)) return;
    const res = await fetch(API_ENDPOINTS.PRODUCT(id), { method: "DELETE" });
    const json = (await res.json().catch(() => ({}))) as {
      error?: string;
      data?: { archived?: boolean; message?: string };
    };
    if (!res.ok) {
      toast.error(json.error || ADMIN_ACTIONS.deleteFailed);
      return;
    }
    toast.success(
      json.data?.archived && json.data.message ? json.data.message : ADMIN_ACTIONS.deleted,
    );
    router.refresh();
  }

  return (
    <Button size="sm" variant="destructive" onClick={onDelete}>
      {ADMIN_ACTIONS.delete}
    </Button>
  );
}
