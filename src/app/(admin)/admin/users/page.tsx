import { AdminUsersClient } from "@/components/features/admin/AdminUsersClient";
import { mapAdminUsers } from "@/lib/db/users";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = mapAdminUsers(
    await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    }),
  );

  return <AdminUsersClient users={users} />;
}
