import {
  getDashboardSummary,
  getPendingTransfers,
  getDataIntegrityIssues,
  getLaporanOpReconciliation,
} from "@/lib/data";
import { getSession } from "@/lib/auth";
import { formatRupiah, formatRupiahCompact } from "@/lib/format";
import { formatRequestorName } from "@/lib/names";
import { SectionCard } from "@/components/section-card";
import { AccountAdjustButton } from "@/components/account-adjust-button";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { IconBadge } from "@/components/primitives/icon-badge";
import {
  Landmark,
  Building2,
  Clock,
  Wallet,
  CalendarDays,
  ShieldAlert,
  GitCompare,
  ChevronRight,
  Plus,
  FileText,
  ReceiptText,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [data, pendingTransfers, integrityIssues, recon, session] = await Promise.all([
    getDashboardSummary(),
    getPendingTransfers(),
    getDataIntegrityIssues(),
    getLaporanOpReconciliation(),
    getSession(),
  ]);
  const isAdmin = session?.role === "admin";

  const op = data.laporanOp?.laporan_op;
  const danaEfektif = op?.dana_efektif ?? 0;
  const saldo = op?.totals?.saldo ?? 0;
  const totalKewajiban = op?.kewajiban?.total ?? 0;
  const sewaTotal = data.sewa?.sewa?.total ?? 0;
  const sewaLocations = data.sewa?.sewa?.locations ?? [];
  const activeCount = sewaLocations.filter((l) => l.status === "active").length;

  const healthRatio = saldo > 0 ? danaEfektif / saldo : 0;
  const health = (() => {
    if (healthRatio >= 0.8) return { label: "Sangat Sehat", tone: "success" as const };
    if (healthRatio >= 0.5) return { label: "Sehat", tone: "success" as const };
    if (healthRatio >= 0.2) return { label: "Perhatian", tone: "warning" as const };
    return { label: "Berisiko", tone: "danger" as const };
  })();

  const reconHasDiff = recon && (recon.diffMasuk !== 0 || recon.diffKeluar !== 0);
  const reconAmount = recon ? Math.abs(recon.diffMasuk) + Math.abs(recon.diffKeluar) : 0;

  const yayasanAccounts = data.accounts.filter((a) => a.type === "yayasan");

  const wajibTotal = data.wajibBulanan.reduce((s, w) => s + (w.amount ?? 0), 0);
  const runway = wajibTotal > 0 ? danaEfektif / wajibTotal : null;

  const errorCount = integrityIssues.filter((i) => i.severity === "error").length;
  const warnCount = integrityIssues.filter((i) => i.severity === "warn").length;
  const auditIssueCount = errorCount + warnCount;

  // Kewajiban items from laporan_op
  const kewajiban = op?.kewajiban;
  const kewajibanItems = kewajiban
    ? [
        kewajiban.dana_pinjam_angkasa_tahap1 != null && kewajiban.dana_pinjam_angkasa_tahap1 > 0
          ? { label: "Dana Pinjam Angkasa Tahap 1", amount: kewajiban.dana_pinjam_angkasa_tahap1 }
          : null,
        kewajiban.dana_pinjam_angkasa_tahap2 != null && kewajiban.dana_pinjam_angkasa_tahap2 > 0
          ? { label: "Dana Pinjam Angkasa Tahap 2", amount: kewajiban.dana_pinjam_angkasa_tahap2 }
          : null,
        kewajiban.dana_pinjam_angkasa_tahap3 != null && kewajiban.dana_pinjam_angkasa_tahap3 > 0
          ? { label: "Dana Pinjam Angkasa Tahap 3", amount: kewajiban.dana_pinjam_angkasa_tahap3 }
          : null,
        kewajiban.dana_pinjam_angkasa_tahap4 != null && kewajiban.dana_pinjam_angkasa_tahap4 > 0
          ? { label: "Dana Pinjam Angkasa Tahap 4", amount: kewajiban.dana_pinjam_angkasa_tahap4 }
          : null,
        kewajiban.lembar2_btn != null && kewajiban.lembar2_btn > 0
          ? { label: "Lembar 2 BTN", amount: kewajiban.lembar2_btn }
          : null,
        kewajiban.pinjaman_btn != null && kewajiban.pinjaman_btn > 0
          ? { label: "Pinjaman BTN", amount: kewajiban.pinjaman_btn }
          : null,
        kewajiban.pinjaman_btn_awal != null && kewajiban.pinjaman_btn_awal > 0
          ? { label: "Pinjaman BTN Awal", amount: kewajiban.pinjaman_btn_awal }
          : null,
        kewajiban.pinjaman_btn_sumare != null && kewajiban.pinjaman_btn_sumare > 0
          ? { label: "Pinjaman BTN Sumare", amount: kewajiban.pinjaman_btn_sumare }
          : null,
      ].filter(Boolean) as { label: string; amount: number }[]
    : [];

  // Build action items for "Perlu ditindak"
  const actionItems: {
    icon: React.ReactNode;
    title: string;
    description: string;
    actionLabel: string;
    href: string;
  }[] = [];

  if (data.pengajuanPending > 0) {
    const topRequestor = data.pengajuanByRequestor[0];
    actionItems.push({
      icon: (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-destructive/10">
          <Clock className="h-4 w-4 text-destructive" />
        </div>
      ),
      title: `${data.pengajuanPending} pengajuan belum lunas`,
      description: `${formatRupiah(data.pengajuanTotalAmount)}${topRequestor ? ` · top: ${formatRequestorName(topRequestor._id)} ${formatRupiahCompact(topRequestor.total)}` : ""}`,
      actionLabel: "Bayarkan",
      href: "/pengajuan",
    });
  }

  if (reconHasDiff) {
    actionItems.push({
      icon: (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warning/10">
          <GitCompare className="h-4 w-4 text-warning" />
        </div>
      ),
      title: "Snapshot Laporan Op tidak sinkron",
      description: `Selisih ledger vs entries: ${formatRupiah(reconAmount)}`,
      actionLabel: "Reconcile",
      href: "/laporan-op",
    });
  }

  if (auditIssueCount > 0) {
    actionItems.push({
      icon: (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warning/10">
          <ShieldAlert className="h-4 w-4 text-warning" />
        </div>
      ),
      title: `${auditIssueCount} peringatan audit`,
      description: "Review di Audit Data",
      actionLabel: "Review",
      href: "/audit",
    });
  }

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-center gap-3">
          <IconBadge icon={Landmark} tone="primary" size="lg" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Yayasan YRBB</h1>
            <div className="mt-0.5 flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Dana efektif{" "}
                <span className="font-semibold text-foreground">{formatRupiah(danaEfektif)}</span>
              </span>
              <Badge
                variant={health.tone === "success" ? "success" : health.tone === "warning" ? "warning" : "destructive"}
                className="text-xs"
              >
                {health.label}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link href="/laporan-op" className={buttonVariants({ variant: "outline", size: "sm" })}>
            <FileText className="mr-1.5 h-4 w-4" />
            Laporan Op
          </Link>
          <Link href="/pengajuan" className={buttonVariants({ size: "sm" })}>
            <Plus className="mr-1.5 h-4 w-4" />
            Pengajuan
          </Link>
        </div>
      </div>

      {/* Perlu ditindak */}
      {actionItems.length > 0 && (
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Perlu ditindak</span>
              <Badge variant="warning" className="text-xs">
                {actionItems.length} item
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground">Diurut berdasarkan dampak</span>
          </div>
          <div className="divide-y divide-border/60">
            {actionItems.map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                {item.icon}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                <Link href={item.href} className={`${buttonVariants({ variant: "outline", size: "sm" })} shrink-0`}>
                  {item.actionLabel}
                  <ChevronRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pengajuan per Requestor */}
      {data.pengajuanPending > 0 && (
        <SectionCard
          icon={Clock}
          title="Pengajuan per Requestor"
          tone="danger"
          badge={
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">{data.pengajuanPending} item</span>
              <Badge variant="destructive" className="text-xs">
                {formatRupiahCompact(data.pengajuanTotalAmount)}
              </Badge>
            </div>
          }
          action={
            <Link href="/pengajuan" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
              <ChevronRight className="h-4 w-4" />
            </Link>
          }
        >
          <div className="grid grid-cols-2 gap-2">
            {data.pengajuanByRequestor.map((r) => {
              const initials = (formatRequestorName(r._id) || "?").slice(0, 2).toUpperCase();
              return (
                <div
                  key={r._id}
                  className="flex items-center gap-2.5 rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {formatRequestorName(r._id) || "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">{r.count} tagihan</p>
                  </div>
                  <span className="shrink-0 text-sm font-bold tabular-nums">
                    {formatRupiahCompact(r.total)}
                  </span>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}

      {/* Bottom 2x2 grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Rekening Yayasan */}
        {yayasanAccounts.length > 0 && (
          <SectionCard icon={Wallet} title="Rekening Yayasan" tone="info">
            <div className="divide-y divide-border/60">
              {yayasanAccounts.map((acc) => (
                <div key={acc._id} className="flex items-center justify-between py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{acc.bank}</p>
                    <p className="truncate max-w-[160px] text-xs text-muted-foreground">
                      {formatRequestorName(acc.holder)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-bold tabular-nums">{formatRupiah(acc.balance)}</p>
                    {isAdmin && <AccountAdjustButton account={acc} />}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Kewajiban */}
        {totalKewajiban > 0 && (
          <SectionCard
            icon={ReceiptText}
            title="Kewajiban"
            tone="danger"
            badge={
              <Badge variant="destructive" className="text-xs">
                {formatRupiahCompact(totalKewajiban)}
              </Badge>
            }
            action={
              <Link href="/laporan-op" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
                <ChevronRight className="h-4 w-4" />
              </Link>
            }
          >
            <div className="divide-y divide-border/60">
              {kewajibanItems.length > 0 ? (
                kewajibanItems.map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-semibold tabular-nums">
                      {formatRupiahCompact(item.amount)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="py-2 text-sm text-muted-foreground">
                  Total kewajiban {formatRupiahCompact(totalKewajiban)}
                </p>
              )}
            </div>
          </SectionCard>
        )}

        {/* Sewa Dapur */}
        {data.sewa?.sewa && (
          <SectionCard
            icon={Building2}
            title="Sewa Dapur"
            tone="success"
            badge={
              <Badge variant="outline" className="text-xs">
                {activeCount}/{sewaLocations.length} aktif
              </Badge>
            }
            action={
              <Link href="/sewa" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
                <ChevronRight className="h-4 w-4" />
              </Link>
            }
          >
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tabular-nums">
                  {formatRupiahCompact(sewaTotal)}
                </span>
                <span className="text-xs text-muted-foreground">revenue bulanan</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {sewaLocations
                  .filter((l) => l.status === "active")
                  .map((loc) => (
                    <span
                      key={loc.code}
                      className="rounded-md bg-success/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-success"
                    >
                      {loc.code}
                    </span>
                  ))}
              </div>
            </div>
          </SectionCard>
        )}

        {/* Wajib Bulanan */}
        {data.wajibBulanan.length > 0 && (
          <SectionCard
            icon={CalendarDays}
            title="Wajib Bulanan"
            tone="warning"
            badge={
              <Badge variant="warning" className="text-xs">
                {formatRupiahCompact(wajibTotal)}
              </Badge>
            }
            action={
              <Link href="/wajib-bulanan" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
                <ChevronRight className="h-4 w-4" />
              </Link>
            }
          >
            {runway !== null ? (
              <div>
                <p className="text-sm text-muted-foreground">
                  Komitmen tetap bulanan. Turun dari sisa dana efektif ≈{" "}
                  <span className="font-bold text-foreground">
                    {runway.toFixed(1).replace(".", ",")} bulan
                  </span>{" "}
                  runway.
                </p>
              </div>
            ) : (
              <div>
                <span className="text-xl font-bold tabular-nums">
                  {formatRupiahCompact(wajibTotal)}
                </span>
                <span className="text-xs text-muted-foreground ml-1">/bln</span>
              </div>
            )}
          </SectionCard>
        )}
      </div>
    </div>
  );
}
