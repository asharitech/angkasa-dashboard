import { getEmailNotifs, getEmailNotifStats, getAccounts } from "@/lib/data";
import { NotifikasiClient } from "./notifikasi-client";
import { PageHeader } from "@/components/page-header";
import { Mail } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NotifikasiPage() {
  const [notifs, stats, accounts] = await Promise.all([
    getEmailNotifs({ status: "pending" }),
    getEmailNotifStats(),
    getAccounts(),
  ]);

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <div className="space-y-1.5">
        <PageHeader icon={Mail} title="Notifikasi email" />
        <p className="text-sm text-muted-foreground md:pl-8">
          Antrean pending dari inbox terhubung (bank, e-commerce, e-wallet, dll.). Klasifikasi lalu
          catat ke ledger — atau abaikan jika bukan transaksi relevan.
        </p>
      </div>
      <NotifikasiClient notifs={notifs} stats={stats} accounts={accounts} />
    </main>
  );
}
