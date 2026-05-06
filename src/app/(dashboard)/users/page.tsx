import { Shield, Users } from "lucide-react";
import { isAdminSession, requireDashboardSession } from "@/lib/dashboard-auth";
import { getUsersForAdmin } from "@/lib/dal";
import { ForbiddenState } from "@/components/forbidden-state";
import { PageHeader } from "@/components/page-header";
import { UsersManager, type UserRow } from "@/components/users-manager";
import { DashboardPageShell } from "@/components/layout/dashboard-page-shell";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const session = await requireDashboardSession();

  if (!isAdminSession(session)) {
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
