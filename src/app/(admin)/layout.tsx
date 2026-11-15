import { redirect } from "next/navigation";
import { AdminShell } from "@/components/features/admin/AdminShell";
import { auth } from "@/lib/auth/auth";
import { isAdminSession } from "@/lib/auth/require-admin";
import { ROUTES } from "@/constants/routes";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user || !(await isAdminSession(session))) {
    redirect(ROUTES.LOGIN);
  }

  return <AdminShell>{children}</AdminShell>;
}
