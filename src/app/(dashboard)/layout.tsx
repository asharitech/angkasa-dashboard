import { Shell } from "@/components/shell";
import { getSession } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  return <Shell isAdmin={session?.role === "admin"}>{children}</Shell>;
}
