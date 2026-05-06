import type { Metadata } from "next";
import { getEmailNotifs, getEmailNotifStats, getAccounts } from "@/lib/data";
import { NotifikasiClient } from "./notifikasi-client";
import { PageHeader } from "@/components/page-header";
import { DashboardPageShell } from "@/components/layout/dashboard-page-shell";
import { Mail } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Notifikasi email",
};

export default async function NotifikasiPage() {
  const [notifs, stats, accounts] = await Promise.all([
    getEmailNotifs({ status: "pending" }),
    getEmailNotifStats(),
    getAccounts(),
  ]);

  return (
    <DashboardPageShell gap="relaxed" className="py-2 md:py-0">
      <PageHeader
        icon={Mail}
        title="Notifikasi email"
        description="Antrean pending dari inbox terhubung (bank, e-commerce, e-wallet, dll.). Klasifikasi lalu catat ke ledger — atau abaikan jika bukan transaksi relevan."
      />
      <NotifikasiClient notifs={notifs} stats={stats} accounts={accounts} />
    </DashboardPageShell>
  );
}
