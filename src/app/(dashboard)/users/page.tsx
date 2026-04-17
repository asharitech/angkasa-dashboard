import { redirect } from "next/navigation";
import Link from "next/link";
import { Shield, Users } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { PageHeader } from "@/components/page-header";
import { UsersManager, type UserRow } from "@/components/users-manager";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  if (session.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Shield className="mb-4 h-12 w-12 text-muted-foreground" />
        <p className="text-base text-muted-foreground">
          Hanya admin yang dapat mengakses halaman ini
        </p>
        <Link href="/" className="mt-4 text-sm font-medium text-primary hover:underline">
          Kembali ke beranda
        </Link>
      </div>
    );
  }

  const db = await getDb();
  const rows = await db
    .collection("users")
    .find({}, { projection: { password_hash: 0 } })
    .sort({ created_at: -1 })
    .toArray();

  const users: UserRow[] = rows.map((u) => ({
    _id: String(u._id),
    username: String(u.username ?? ""),
    name: String(u.name ?? ""),
    role: u.role === "admin" ? "admin" : "viewer",
    phone: u.phone ? String(u.phone) : undefined,
    created_at:
      u.created_at instanceof Date
        ? u.created_at.toISOString()
        : String(u.created_at ?? ""),
  }));

  return (
    <div className="space-y-5">
      <PageHeader icon={Users} title="Manajemen User" />
      <UsersManager users={users} currentUserId={session.userId} />
    </div>
  );
}
