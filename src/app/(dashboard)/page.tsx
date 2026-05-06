import type { Metadata } from "next";
import {
  getDashboardSummary,
  getDataIntegrityIssues,
  getLaporanOpReconciliation,
  getEmailNotifStats,
} from "@/lib/dal";
import { getSession } from "@/lib/auth";
import { formatRupiah, formatRupiahCompact } from "@/lib/format"
import { kewajibanRows } from "@/lib/kewajiban-display";
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
  Target,
  Mail,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import { DashboardPageShell } from "@/components/layout/dashboard-page-shell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Beranda",
};

export default async function DashboardPage() {
  const [data, integrityIssues, recon, session, notifStats] = await Promise.all([
    getDashboardSummary(),
    getDataIntegrityIssues(),
    getLaporanOpReconciliation(),
    getSession(),
    getEmailNotifStats(),
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

  const kewajiban = op?.kewajiban;
  const kewajibanItems = kewajiban
    ? kewajibanRows(kewajiban).map(([label, amount]) => ({ label, amount }))
    : [];

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
      description: `${formatRupiahCompact(data.pengajuanTotalAmount)}${topRequestor ? ` · top: ${formatRequestorName(topRequestor._id)} ${formatRupiahCompact(topRequestor.total)}` : ""}`,
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
      title: "Laporan Op tidak sinkron",
      description: `Selisih ledger vs entries: ${formatRupiahCompact(reconAmount)}`,
      actionLabel: "Reconcile",
      href: "/laporan-op",
    });
  }

  if (notifStats.pending > 0) {
    actionItems.push({
      icon: (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-info/10">
          <Mail className="h-4 w-4 text-info" />
        </div>
      ),
      title: `${notifStats.pending} notifikasi email menunggu`,
      description: "Klasifikasi lalu catat ke buku besar dari alert bank atau e-wallet.",
      actionLabel: "Proses",
      href: "/notifikasi",
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

  const healthBadgeVariant =
    health.tone === "success" ? "success" : health.tone === "warning" ? "warning" : "destructive";

  return (
    <DashboardPageShell gap="compact">
      {/* Mobile: teal hero card */}
      <div className="md:hidden rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-5 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
              <Landmark className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold">Yayasan YRBB</span>
          </div>
          <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold">
            {health.label}
          </span>
        </div>
        <div className="mt-4">
          <p className="text-xs font-medium opacity-75">Dana efektif</p>
          <p className="mt-0.5 text-3xl font-bold tabular-nums tracking-tight">
            {formatRupiahCompact(danaEfektif)}
          </p>
        </div>
        <div className="mt-4 flex gap-2">
          <Link
            href="/laporan-op"
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-white/15 py-2 text-xs font-semibold hover:bg-white/25 transition-colors"
          >
            <FileText className="h-3.5 w-3.5" />
            Laporan Op
          </Link>
          <Link
            href="/pengajuan"
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-white/90 py-2 text-xs font-bold text-primary hover:bg-white transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Pengajuan
          </Link>
        </div>
      </div>

      {/* Desktop: text header with action buttons */}
      <div className="hidden md:flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <IconBadge icon={Landmark} tone="primary" size="lg" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Yayasan YRBB</h1>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Dana efektif{" "}
                <span className="font-semibold text-foreground">{formatRupiah(danaEfektif)}</span>
              </span>
              <Badge variant={healthBadgeVariant} className="text-xs">
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

      {/* Akses cepat — pribadi & inbox */}
      <div className="rounded-xl border border-border/80 bg-card/80 p-3 shadow-sm backdrop-blur-sm md:p-4">
        <p className="mb-2.5 px-0.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Akses cepat
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Link
            href="/pribadi"
            className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-background px-3 py-3 text-left transition-colors hover:border-primary/40 hover:bg-accent/50"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Wallet className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold leading-tight">Pengeluaran</p>
              <p className="text-[10px] text-muted-foreground">Pribadi</p>
            </div>
          </Link>
          <Link
            href="/anggaran"
            className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-background px-3 py-3 text-left transition-colors hover:border-primary/40 hover:bg-accent/50"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-info/10 text-info">
              <Target className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold leading-tight">Anggaran</p>
              <p className="text-[10px] text-muted-foreground">Budget</p>
            </div>
          </Link>
          <Link
            href="/cicilan"
            className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-background px-3 py-3 text-left transition-colors hover:border-primary/40 hover:bg-accent/50"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-800 dark:text-amber-200">
              <CreditCard className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold leading-tight">Cicilan</p>
              <p className="text-[10px] text-muted-foreground">Loan</p>
            </div>
          </Link>
          <Link
            href="/notifikasi"
            className="relative flex items-center gap-2.5 rounded-xl border border-border/60 bg-background px-3 py-3 text-left transition-colors hover:border-primary/40 hover:bg-accent/50"
          >
            {notifStats.pending > 0 && (
              <span className="absolute right-2 top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                {notifStats.pending > 99 ? "99+" : notifStats.pending}
              </span>
            )}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
              <Mail className="h-4 w-4" />
            </div>
            <div className="min-w-0 pr-6">
              <p className="text-xs font-semibold leading-tight">Notifikasi</p>
              <p className="text-[10px] text-muted-foreground">Email bank</p>
            </div>
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
            <span className="hidden sm:block text-xs text-muted-foreground">
              Diurut berdasarkan dampak
            </span>
          </div>
          <div className="divide-y divide-border/60">
            {actionItems.map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                {item.icon}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-snug">{item.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                </div>
                <Link
                  href={item.href}
                  className={`${buttonVariants({ variant: "outline", size: "sm" })} shrink-0`}
                >
                  <span className="hidden sm:inline">{item.actionLabel}</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pengajuan per Requestor */}
      {data.pengajuanPending > 0 && (
        <div className="rounded-xl border border-border bg-card shadow-sm">
          {/* Card header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border/60">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-destructive/10">
              <Clock className="h-3.5 w-3.5 text-destructive" />
            </div>
            <span className="text-sm font-semibold">
              Pengajuan<span className="hidden sm:inline"> per Requestor</span>
            </span>
            <Badge variant="secondary" className="text-xs tabular-nums">
              {data.pengajuanPending}
            </Badge>
            <Badge variant="destructive" className="text-xs tabular-nums">
              {formatRupiahCompact(data.pengajuanTotalAmount)}
            </Badge>
            <Link
              href="/pengajuan"
              className="ml-auto flex items-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          {/* Requestor grid */}
          <div className="p-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-2">
            {data.pengajuanByRequestor.map((r) => {
              const name = formatRequestorName(r._id) || "—";
              const initials = name === "—" ? "?" : name.slice(0, 2).toUpperCase();
              return (
                <div
                  key={r._id}
                  className="flex items-center gap-2.5 rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold leading-tight">{name}</p>
                    <p className="text-xs text-muted-foreground">{r.count} tagihan</p>
                    {/* Amount below name on mobile */}
                    <p className="text-sm font-bold tabular-nums sm:hidden">
                      {formatRupiahCompact(r.total)}
                    </p>
                  </div>
                  {/* Amount right-aligned on desktop */}
                  <span className="hidden sm:block shrink-0 text-sm font-bold tabular-nums">
                    {formatRupiahCompact(r.total)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom grid — single col on mobile, 2-col on desktop */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Rekening Yayasan */}
        {yayasanAccounts.length > 0 && (
          <SectionCard icon={Wallet} title="Rekening Yayasan" tone="info">
            <div className="divide-y divide-border/60">
              {yayasanAccounts.map((acc) => (
                <div key={acc._id} className="flex items-center justify-between py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{acc.bank}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                      {formatRequestorName(acc.holder)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
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
              <Link
                href="/laporan-op"
                className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </Link>
            }
          >
            <div className="divide-y divide-border/60">
              {kewajibanItems.length > 0 ? (
                kewajibanItems.map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-semibold tabular-nums shrink-0 ml-2">
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
              <Link
                href="/sewa"
                className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
              >
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
              <Link
                href="/wajib-bulanan"
                className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </Link>
            }
          >
            {runway !== null ? (
              <p className="text-sm text-muted-foreground">
                Komitmen tetap bulanan. Turun dari sisa dana efektif ≈{" "}
                <span className="font-bold text-foreground">
                  {runway.toFixed(1).replace(".", ",")} bulan
                </span>{" "}
                runway.
              </p>
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
    </DashboardPageShell>
  );
}
