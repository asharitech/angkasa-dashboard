import type { Metadata } from "next";
import { getEmailNotifs, getEmailNotifStats, getAccounts } from "@/lib/dal";
import { NotifikasiClient } from "./notifikasi-client";
import { ListPageLayout } from "@/components/layout/list-page-layout";
import type { KpiItem } from "@/components/kpi-strip";
import { Mail, Inbox, ListChecks, CheckCircle2, XCircle, EyeOff } from "lucide-react";

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

  const kpi: KpiItem[] = [
    {
      label: "Menunggu",
      value: String(stats.pending),
      icon: Inbox,
      tone: "warning",
      hint: "Perlu review",
    },
    {
      label: "Total rekaman",
      value: String(stats.total),
      icon: ListChecks,
      tone: "neutral",
    },
    {
      label: "Sudah dicatat",
      value: String(stats.approved),
      icon: CheckCircle2,
      tone: "success",
    },
    {
      label: "Ditolak",
      value: String(stats.rejected),
      icon: XCircle,
      tone: "danger",
    },
    {
      label: "Diabaikan",
      value: String(stats.ignored),
      icon: EyeOff,
      tone: "muted",
    },
  ];

  return (
    <ListPageLayout
      title="Notifikasi email"
      icon={Mail}
      description="Antrean dari inbox Gmail (akun angkasa): diisi otomatis oleh cron OpenClaw AI — agen membaca email mentah, lalu menulis ke database sebagai pending. Review di sini, klasifikasikan, lalu posting ke buku besar (domain yayasan atau pribadi saat menyimpan)."
      kpi={kpi}
      kpiCols={5}
      gap="relaxed"
    >
      <NotifikasiClient notifs={notifs} accounts={accounts} />
    </ListPageLayout>
  );
}
