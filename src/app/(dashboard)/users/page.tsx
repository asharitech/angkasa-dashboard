import { redirect } from "next/navigation";
import { Shield, Users } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getUsersForAdmin } from "@/lib/dal";
import { ForbiddenState } from "@/components/forbidden-state";
import { PageHeader } from "@/components/page-header";
import { UsersManager, type UserRow } from "@/components/users-manager";
import { DashboardPageShell } from "@/components/layout/dashboard-page-shell";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  if (session.role !== "admin") {
    return (
      <ForbiddenState
        icon={Shield}
        title="Hanya admin yang dapat mengakses halaman ini"
      />
    );
  }

  const users: UserRow[] = await getUsersForAdmin();

  return (
    <DashboardPageShell>
      <PageHeader icon={Users} title="Manajemen User" />
      <UsersManager users={users} currentUserId={session.userId} />
    </DashboardPageShell>
  );
}
