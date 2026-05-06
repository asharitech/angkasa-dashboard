"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDialog } from "@/components/primitives/confirm-dialog";
import { PageToolbar } from "@/components/layout/page-toolbar";
import { updateEmailNotifAction, approveEmailNotifAction, deleteEmailNotifAction } from "@/lib/actions/email-notifs";
import type { EmailNotif } from "@/lib/dal";
import type { Account } from "@/lib/types";
import { idString } from "@/lib/utils";
import {
  DASHBOARD_SEARCH_INPUT_CLASS,
  DASHBOARD_STACK_HEADER_BORDER,
  DashboardAlertBanner,
} from "@/components/layout/dashboard-surface";
import { formatRupiah } from "@/lib/format";
import {
  type EmailSourceFilter,
  type EmailNotifSort,
  matchesEmailSourceFilter,
  isLikelyShallowDescription,
} from "./email-notif-helpers";
import { ApproveNotifForm, type ApproveNotifPayload } from "./approve-notif-form";
import { EmailNotifRow } from "./email-notif-row";
import { Mail, Search, AlertCircle, ListFilter } from "lucide-react";
import { cn } from "@/lib/utils";

function actionErrorMessage(e: unknown): string {
  return e instanceof Error ? e.message : "Terjadi kesalahan. Coba lagi.";
}

const SOURCE_FILTER_TABS: { id: EmailSourceFilter; label: string }[] = [
  { id: "all", label: "Semua" },
  { id: "bca", label: "BCA" },
  { id: "bri", label: "BRI" },
  { id: "other", label: "Lainnya" },
];

export function NotifikasiClient({
  notifs,
  accounts,
}: {
  notifs: EmailNotif[];
  accounts: Account[];
}) {
  const [items, setItems] = useState<EmailNotif[]>(notifs);
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<EmailSourceFilter>("all");
  const [sort, setSort] = useState<EmailNotifSort>("newest");
  const [selected, setSelected] = useState<EmailNotif | null>(null);
  const [approveOpen, setApproveOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EmailNotif | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const canPost = accounts.length > 0;
  const noAccountsHint = canPost ? undefined : "Tambahkan akun bank di data terlebih dahulu";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((n) => {
      if (!matchesEmailSourceFilter(n.source, sourceFilter)) return false;
      if (!q) return true;
      const hay = [
        n.description,
        n.email_subject,
        n.beneficiary_name,
        n.beneficiary_bank,
        n.reference_no,
        n.source,
        n.transfer_method,
        n.raw_body,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [items, query, sourceFilter]);

  const shallowLegacyCount = useMemo(
    () => items.filter((n) => isLikelyShallowDescription(n)).length,
    [items],
  );

  const sortedRows = useMemo(() => {
    const copy = [...filtered];
    const byDate = (a: EmailNotif, b: EmailNotif) =>
      new Date(b.parsed_date).getTime() - new Date(a.parsed_date).getTime();
    switch (sort) {
      case "oldest":
        copy.sort((a, b) => -byDate(a, b));
        break;
      case "amount_high":
        copy.sort((a, b) => b.amount - a.amount);
        break;
      case "amount_low":
        copy.sort((a, b) => a.amount - b.amount);
        break;
      default:
        copy.sort(byDate);
    }
    return copy;
  }, [filtered, sort]);

  const setRowBusy = (id: string | null) => {
    setBusyId(id);
  };

  const handleClassify = async (id: string, classification: string) => {
    setErrorBanner(null);
    setRowBusy(id);
    try {
      await updateEmailNotifAction(id, { classification });
      setItems((prev) => prev.map((n) => (idString(n._id) === id ? { ...n, classification } : n)));
    } catch (e) {
      setErrorBanner(actionErrorMessage(e));
    } finally {
      setRowBusy(null);
    }
  };

  const handleApprove = async (id: string, data: ApproveNotifPayload) => {
    setErrorBanner(null);
    setRowBusy(id);
    try {
      await approveEmailNotifAction(id, {
        account_id: data.account_id,
        category: data.category,
        description: data.description,
        domain: data.domain,
        type: data.type,
      });
      setItems((prev) => prev.filter((n) => idString(n._id) !== id));
      setApproveOpen(false);
      setSelected(null);
    } catch (e) {
      setErrorBanner(actionErrorMessage(e));
    } finally {
      setRowBusy(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const id = idString(deleteTarget._id);
    setErrorBanner(null);
    setDeletePending(true);
    try {
      await deleteEmailNotifAction(id);
      setItems((prev) => prev.filter((n) => idString(n._id) !== id));
      setDeleteTarget(null);
    } catch (e) {
      setErrorBanner(actionErrorMessage(e));
    } finally {
      setDeletePending(false);
    }
  };

  const handleIgnore = async (id: string) => {
    setErrorBanner(null);
    setRowBusy(id);
    try {
      await updateEmailNotifAction(id, { status: "ignored" });
      setItems((prev) => prev.filter((n) => idString(n._id) !== id));
    } catch (e) {
      setErrorBanner(actionErrorMessage(e));
    } finally {
      setRowBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      {errorBanner ? (
        <DashboardAlertBanner>
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="font-medium leading-snug">{errorBanner}</p>
            <button
              type="button"
              className="mt-2 text-xs font-medium underline underline-offset-2 hover:text-destructive/90"
              onClick={() => setErrorBanner(null)}
            >
              Tutup
            </button>
          </div>
        </DashboardAlertBanner>
      ) : null}

      {shallowLegacyCount > 0 ? (
        <DashboardAlertBanner className="border-info/40 bg-info/10 text-foreground">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-info" aria-hidden />
          <div className="min-w-0 flex-1 space-y-2 text-sm leading-relaxed">
            <p className="font-semibold">
              {shallowLegacyCount} baris tampak dari ingest lama (hampir hanya subjek bank).
            </p>
            <p className="text-muted-foreground">
              Dashboard tidak mengisi ulang dari inbox sendiri. Yang memperbarui <code className="rounded bg-background/80 px-1 py-px font-mono text-xs">description</code>,{" "}
              <code className="rounded bg-background/80 px-1 py-px font-mono text-xs">beneficiary</code>, dan{" "}
              <code className="rounded bg-background/80 px-1 py-px font-mono text-xs">raw_body</code> di Mongo adalah{" "}
              <strong>satu sesi agen OpenClaw</strong> (instruksi sama seperti cron{" "}
              <code className="rounded bg-background/80 px-1 py-px font-mono text-xs">angkasa-email-sync-ai-v4</code>
              ), dengan fetch per UID dan reasoning di atas badan email — tanpa skrip parser batch di repo.
            </p>
            <p className="text-xs text-muted-foreground">
              Minta agen: backfill pending yang dangkal + perbaiki tanggal invalid; atau tunggu jadwal cron berikutnya.
            </p>
          </div>
        </DashboardAlertBanner>
      ) : null}

      <PageToolbar>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-4">
          <div className="relative min-w-0 flex-1 lg:max-w-md">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari penerima, subjek, referensi, bank…"
              className={DASHBOARD_SEARCH_INPUT_CLASS}
              aria-label="Cari notifikasi"
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <div className="flex items-center gap-2">
              <ListFilter className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="sr-only">Filter sumber email</span>
              <div
                role="tablist"
                aria-label="Filter sumber"
                className="inline-flex flex-wrap gap-1 rounded-lg bg-muted/60 p-1"
              >
                {SOURCE_FILTER_TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={sourceFilter === t.id}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                      sourceFilter === t.id
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    onClick={() => setSourceFilter(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 sm:min-w-[200px]">
              <span className="whitespace-nowrap text-xs font-medium text-muted-foreground">Urutkan</span>
              <Select value={sort} onValueChange={(v) => setSort((v as EmailNotifSort) ?? "newest")}>
                <SelectTrigger className="h-9 rounded-lg text-sm" aria-label="Urutkan daftar">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Terbaru</SelectItem>
                  <SelectItem value="oldest">Terlama</SelectItem>
                  <SelectItem value="amount_high">Nominal tertinggi</SelectItem>
                  <SelectItem value="amount_low">Nominal terendah</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {(query || sourceFilter !== "all") && (
          <p className="text-xs text-muted-foreground">
            Menampilkan <span className="font-semibold text-foreground">{sortedRows.length}</span> dari{" "}
            <span className="font-semibold text-foreground">{items.length}</span> antrean
          </p>
        )}
      </PageToolbar>

      <section aria-label="Antrean notifikasi email" className="space-y-4">
        {items.length === 0 && (
          <EmptyState
            icon={Mail}
            title="Antrean kosong"
            description="Tidak ada notifikasi pending. Antrean diisi oleh cron AI angkasa (OpenClaw); jika kosong, belum ada email bank baru yang lolos filter atau belum jadwal sinkron. Statistik di atas mencakup semua status."
            tone="muted"
            variant="dashed"
          />
        )}

        {items.length > 0 && sortedRows.length === 0 && (
          <EmptyState
            icon={Search}
            title="Tidak ada yang cocok"
            description="Sesuaikan filter sumber atau kosongkan pencarian."
            tone="muted"
            variant="dashed"
            action={
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setQuery("")}>
                  Reset pencarian
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setSourceFilter("all")}>
                  Semua sumber
                </Button>
              </div>
            }
          />
        )}

        <ul className="space-y-4">
          {sortedRows.map((n) => {
            const nid = idString(n._id);
            return (
              <li key={nid}>
                <EmailNotifRow
                  n={n}
                  busy={busyId === nid}
                  canPost={canPost}
                  noAccountsHint={noAccountsHint}
                  onClassify={handleClassify}
                  onOpenApprove={(row) => {
                    setSelected(row);
                    setApproveOpen(true);
                  }}
                  onIgnore={handleIgnore}
                  onRequestDelete={setDeleteTarget}
                />
              </li>
            );
          })}
        </ul>
      </section>

      {selected ? (
        <Dialog
          open={approveOpen}
          onOpenChange={(open) => {
            setApproveOpen(open);
            if (!open) setSelected(null);
          }}
        >
          <DialogContent className="max-h-[min(90vh,720px)] max-w-lg gap-0 overflow-y-auto rounded-2xl p-0 sm:max-w-lg">
            <div className={cn(DASHBOARD_STACK_HEADER_BORDER, "bg-muted/40 px-6 py-4")}>
              <DialogHeader className="space-y-1 text-left">
                <DialogTitle className="text-lg">Catat transaksi dari email</DialogTitle>
                <DialogDescription>
                  Entri baru akan ditulis ke koleksi transaksi dengan sumber{" "}
                  <span className="font-medium text-foreground">email:{selected.source}</span>. Saldo akun yang dipilih
                  akan disesuaikan.
                </DialogDescription>
              </DialogHeader>
            </div>
            <div className="px-6 py-5">
              <ApproveNotifForm
                key={idString(selected._id)}
                notif={selected}
                accounts={accounts}
                disabled={busyId != null}
                onSubmit={(data) => handleApprove(idString(selected._id), data)}
                onCancel={() => {
                  setApproveOpen(false);
                  setSelected(null);
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      ) : null}

      <ConfirmDialog
        open={deleteTarget != null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Hapus dari antrean?"
        description={
          deleteTarget ? (
            <span>
              <strong className="text-foreground">{deleteTarget.description}</strong>
              <span className="block pt-1 text-muted-foreground">
                {formatRupiah(deleteTarget.amount)} — hanya menghapus notifikasi; tidak mengubah entri yang sudah pernah
                diposting.
              </span>
            </span>
          ) : null
        }
        confirmLabel="Hapus"
        confirmVariant="destructive"
        pending={deletePending}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
