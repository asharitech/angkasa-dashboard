import { getEmailNotifs, getEmailNotifStats, getAccounts } from "@/lib/data";
import { NotifikasiClient } from "./notifikasi-client";

export const dynamic = "force-dynamic";

export default async function NotifikasiPage() {
  const [notifs, stats, accounts] = await Promise.all([
    getEmailNotifs({ status: "pending" }),
    getEmailNotifStats(),
    getAccounts(),
  ]);

  return (
    <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notifikasi Email</h1>
        <p className="text-muted-foreground text-sm">
          Notifikasi transfer dari BRI & BCA yang masuk via email — klasifikasikan sebelum dicatat.
        </p>
      </div>
      <NotifikasiClient notifs={notifs} stats={stats} accounts={accounts} />
    </main>
  );
}
