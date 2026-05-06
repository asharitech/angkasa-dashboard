import type { Metadata } from "next";
import { getAccounts } from "@/lib/dal";
import { isAdminSession, requireDashboardSession } from "@/lib/dashboard-auth";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { AccountAdjustButton } from "@/components/account-adjust-button";
import { formatRupiah } from "@/lib/format";
import { ShieldCheck, Database } from "lucide-react";
import { ForbiddenState } from "@/components/forbidden-state";
import { AdminMasterClient } from "./admin-master-client";
import { DashboardPageShell } from "@/components/layout/dashboard-page-shell";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Master Data",
};

export default async function AdminPage() {
  const session = await requireDashboardSession();

  if (!isAdminSession(session)) {
    return (
      <ForbiddenState
        icon={ShieldCheck}
        title="Hanya admin yang dapat mengakses halaman ini"
      />
    );
  }

  const accounts = await getAccounts();

  return (
    <DashboardPageShell gap="relaxed">
      <PageHeader icon={ShieldCheck} title="Admin Master Data" />
      
      <SectionCard icon={Database} title="Semua Rekening & Saldo" tone="info">
        <div className="divide-y divide-border/60">
          {accounts.map((acc) => (
            <div key={acc._id} className="flex items-center justify-between py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{acc.bank}</p>
                  <span className="text-[10px] uppercase bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{acc.type}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                  {acc.holder} · {acc._id}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <p className="text-sm font-bold tabular-nums">{formatRupiah(acc.balance)}</p>
                <AccountAdjustButton account={acc} />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <AdminMasterClient />
    </DashboardPageShell>
  );
}
