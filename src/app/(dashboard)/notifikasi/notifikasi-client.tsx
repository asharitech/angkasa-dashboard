"use client";

import { useMemo, useState, type ComponentType } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { BadgeVariant } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/empty-state";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/primitives/confirm-dialog";
import { updateEmailNotifAction, approveEmailNotifAction, deleteEmailNotifAction } from "@/lib/actions/email-notifs";
import { formatRupiah, formatDateTime } from "@/lib/format";
import type { EmailNotif } from "@/lib/data";
import type { Account } from "@/lib/types";
import { idString, cn } from "@/lib/utils";
import {
  Inbox,
  CheckCircle2,
  XCircle,
  Mail,
  Search,
  MoreHorizontal,
  EyeOff,
  Trash2,
  ArrowRightLeft,
  Sparkles,
  Building2,
  CreditCard,
  ShoppingBag,
  Wallet,
  ListChecks,
} from "lucide-react";

const CLASSIFICATIONS = [
  { value: "yayasan_puang", label: "Yayasan — Puang Imran" },
  { value: "yayasan_staff", label: "Yayasan — Staff" },
  { value: "pribadi_angkasa", label: "Pribadi — Angkasa" },
  { value: "pribadi_eba", label: "Pribadi — Eba" },
  { value: "piutang", label: "Piutang" },
  { value: "numpang", label: "Numpang" },
  { value: "tabungan", label: "Tabungan" },
  { value: "cicilan", label: "Cicilan" },
  { value: "transit", label: "Transit" },
  { value: "lainnya", label: "Lainnya" },
];

function statusBadgeVariant(status: string): BadgeVariant {
  switch (status) {
    case "pending":
      return "warning";
    case "approved":
      return "success";
    case "rejected":
      return "destructive";
    case "ignored":
      return "secondary";
    default:
      return "outline";
  }
}

const SOURCE_LABELS: Record<string, string> = {
  bri: "BRI",
  bca: "BCA",
  mega: "Bank Mega",
  shopee: "Shopee",
  gojek: "Gojek",
  grab: "Grab",
  tokopedia: "Tokopedia",
  other: "Lainnya",
};

function sourceLabel(source: string): string {
  const k = (source || "").toLowerCase();
  return SOURCE_LABELS[k] || source || "Sumber";
}

function sourceBorder(source: string): string {
  const k = (source || "").toLowerCase();
  if (k === "bca") return "border-l-sky-500";
  if (k === "bri") return "border-l-emerald-600";
  if (k === "mega") return "border-l-violet-600";
  if (k === "shopee" || k === "tokopedia") return "border-l-orange-500";
  if (k === "gojek" || k === "grab") return "border-l-teal-600";
  return "border-l-primary";
}

function sourceTint(source: string): string {
  const k = (source || "").toLowerCase();
  if (k === "bca") return "bg-sky-500/[0.06]";
  if (k === "bri") return "bg-emerald-600/[0.06]";
  if (k === "mega") return "bg-violet-600/[0.06]";
  if (k === "shopee" || k === "tokopedia") return "bg-orange-500/[0.06]";
  if (k === "gojek" || k === "grab") return "bg-teal-600/[0.06]";
  return "bg-primary/[0.06]";
}

function SourceIcon({ source }: { source: string }) {
  const k = (source || "").toLowerCase();
  const wrap = "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-card shadow-sm";
  if (k === "bca") return <div className={wrap}><Building2 className="h-5 w-5 text-sky-600 dark:text-sky-400" aria-hidden /></div>;
  if (k === "bri") return <div className={wrap}><Wallet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden /></div>;
  if (k === "mega") return <div className={wrap}><CreditCard className="h-5 w-5 text-violet-600 dark:text-violet-400" aria-hidden /></div>;
  if (k === "shopee" || k === "tokopedia")
    return (
      <div className={wrap}>
        <ShoppingBag className="h-5 w-5 text-orange-600 dark:text-orange-400" aria-hidden />
      </div>
    );
  return <div className={wrap}><Sparkles className="h-5 w-5 text-primary" aria-hidden /></div>;
}

export function NotifikasiClient({
  notifs,
  stats,
  accounts,
}: {
  notifs: EmailNotif[];
  stats: { total: number; pending: number; approved: number; rejected: number };
  accounts: Account[];
}) {
  const [items, setItems] = useState<EmailNotif[]>(notifs);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<EmailNotif | null>(null);
  const [approveOpen, setApproveOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<EmailNotif | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((n) => {
      const hay = [
        n.description,
        n.email_subject,
        n.beneficiary_name,
        n.beneficiary_bank,
        n.reference_no,
        n.source,
        n.transfer_method,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [items, query]);

  const handleClassify = async (id: string, classification: string) => {
    setLoading(true);
    await updateEmailNotifAction(id, { classification });
    setItems((prev) => prev.map((n) => (idString(n._id) === id ? { ...n, classification } : n)));
    setLoading(false);
  };

  const handleApprove = async (id: string, data: { account_id: string; category: string; description: string }) => {
    setLoading(true);
    await approveEmailNotifAction(id, data);
    setItems((prev) => prev.filter((n) => idString(n._id) !== id));
    setApproveOpen(false);
    setSelected(null);
    setLoading(false);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const id = idString(deleteTarget._id);
    setDeletePending(true);
    try {
      await deleteEmailNotifAction(id);
      setItems((prev) => prev.filter((n) => idString(n._id) !== id));
      setDeleteTarget(null);
    } finally {
      setDeletePending(false);
    }
  };

  const handleIgnore = async (id: string) => {
    setLoading(true);
    await updateEmailNotifAction(id, { status: "ignored" });
    setItems((prev) => prev.filter((n) => idString(n._id) !== id));
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      {/* Hero + stats */}
      <section className="overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card to-primary/[0.04] shadow-sm">
        <div className="border-b border-border/60 bg-muted/30 px-4 py-5 md:px-6 md:py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <ListChecks className="h-3.5 w-3.5" aria-hidden />
                Antrian pending
              </div>
              <p className="text-3xl font-bold tabular-nums tracking-tight text-foreground md:text-4xl">
                {stats.pending}
                <span className="text-lg font-semibold text-muted-foreground md:text-xl">
                  {" "}
                  / {stats.total}
                </span>
              </p>
              <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
                Review setiap notifikasi dari inbox, pilih klasifikasi, lalu catat ke buku besar. Gunakan pencarian untuk
                menyaring berdasarkan deskripsi, referensi, atau penerima.
              </p>
            </div>
            <div className="grid w-full grid-cols-3 gap-2 md:w-auto md:min-w-[280px] md:grid-cols-3 md:gap-3">
              <StatMini icon={Inbox} label="Total" value={stats.total} muted />
              <StatMini icon={CheckCircle2} label="Approved" value={stats.approved} tone="success" />
              <StatMini icon={XCircle} label="Rejected" value={stats.rejected} tone="danger" />
            </div>
          </div>
        </div>
      </section>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari deskripsi, ref, penerima, bank…"
            className="h-10 rounded-xl border-border/80 bg-background pl-9 pr-3 shadow-sm"
            aria-label="Cari notifikasi"
          />
        </div>
        {query && (
          <p className="text-xs text-muted-foreground sm:text-right">
            {filtered.length} dari {items.length} ditampilkan
          </p>
        )}
      </div>

      {/* List */}
      <div className="space-y-4">
        {items.length === 0 && (
          <EmptyState
            icon={Mail}
            title="Antrian kosong"
            description="Tidak ada notifikasi pending. Yang sudah diproses tetap terlihat di ringkasan statistik di atas."
            tone="muted"
          />
        )}

        {items.length > 0 && filtered.length === 0 && (
          <EmptyState
            icon={Search}
            title="Tidak ada hasil"
            description="Coba kata kunci lain atau kosongkan pencarian."
            tone="muted"
            action={
              <Button type="button" variant="outline" size="sm" onClick={() => setQuery("")}>
                Reset pencarian
              </Button>
            }
          />
        )}

        <ul className="space-y-4" aria-busy={loading}>
          {filtered.map((n) => {
            const nid = idString(n._id);
            return (
              <li key={nid}>
                <article
                  className={cn(
                    "group relative overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition-shadow hover:shadow-md",
                    "border-l-4 pl-0",
                    sourceBorder(n.source)
                  )}
                >
                  <div
                    className={cn(
                      "flex flex-col gap-4 p-4 md:flex-row md:items-stretch md:gap-5 md:p-5",
                      sourceTint(n.source)
                    )}
                  >
                    <SourceIcon source={n.source} />
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={statusBadgeVariant(n.status)} className="uppercase">
                          {n.status}
                        </Badge>
                        <Badge variant="secondary" className="font-medium">
                          {sourceLabel(n.source)}
                        </Badge>
                        {n.transfer_method && (
                          <Badge variant="outline" className="text-[11px] font-normal">
                            {n.transfer_method}
                          </Badge>
                        )}
                        {n.classification && (
                          <Badge variant="info" className="text-[11px]">
                            {CLASSIFICATIONS.find((c) => c.value === n.classification)?.label || n.classification}
                          </Badge>
                        )}
                      </div>

                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Nominal</p>
                        <p className="text-2xl font-bold tabular-nums tracking-tight text-foreground md:text-3xl">
                          {formatRupiah(n.amount)}
                          {n.fee ? (
                            <span className="ml-2 text-sm font-normal text-muted-foreground">
                              + fee {formatRupiah(n.fee)}
                            </span>
                          ) : null}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm font-semibold leading-snug text-foreground md:text-base">{n.description}</p>
                        {n.email_subject && n.email_subject !== n.description && (
                          <p className="line-clamp-2 text-xs text-muted-foreground">{n.email_subject}</p>
                        )}
                      </div>

                      <dl className="grid grid-cols-1 gap-x-6 gap-y-1 text-xs text-muted-foreground sm:grid-cols-2">
                        <div className="flex gap-2">
                          <dt className="shrink-0 font-medium text-foreground/80">Waktu</dt>
                          <dd>{formatDateTime(n.parsed_date)}</dd>
                        </div>
                        {n.beneficiary_name && (
                          <div className="flex gap-2">
                            <dt className="shrink-0 font-medium text-foreground/80">Penerima</dt>
                            <dd className="truncate">{n.beneficiary_name}</dd>
                          </div>
                        )}
                        {n.beneficiary_bank && (
                          <div className="flex gap-2">
                            <dt className="shrink-0 font-medium text-foreground/80">Bank</dt>
                            <dd className="truncate">{n.beneficiary_bank}</dd>
                          </div>
                        )}
                        {n.reference_no && (
                          <div className="flex gap-2">
                            <dt className="shrink-0 font-medium text-foreground/80">Ref</dt>
                            <dd className="truncate font-mono text-[11px]">{n.reference_no}</dd>
                          </div>
                        )}
                      </dl>
                    </div>

                    <div className="flex shrink-0 flex-col gap-2 border-t border-border/60 pt-4 md:w-[220px] md:border-l md:border-t-0 md:pl-5 md:pt-0">
                      <Select
                        value={n.classification || ""}
                        onValueChange={(v) => handleClassify(nid, v ?? "")}
                        disabled={loading}
                      >
                        <SelectTrigger className="h-10 w-full rounded-xl text-left text-sm" aria-label="Klasifikasi">
                          <SelectValue placeholder="Klasifikasi…" />
                        </SelectTrigger>
                        <SelectContent className="max-h-72">
                          {CLASSIFICATIONS.map((c) => (
                            <SelectItem key={c.value} value={c.value}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button
                        type="button"
                        className="h-10 w-full rounded-xl gap-2 font-semibold shadow-sm"
                        disabled={loading}
                        onClick={() => {
                          setSelected(n);
                          setApproveOpen(true);
                        }}
                      >
                        <ArrowRightLeft className="h-4 w-4" aria-hidden />
                        Catat ke buku
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger
                          disabled={loading}
                          className={cn(
                            buttonVariants({ variant: "outline", size: "default" }),
                            "h-10 w-full rounded-xl"
                          )}
                        >
                          <MoreHorizontal className="h-4 w-4" aria-hidden />
                          Lainnya
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleIgnore(nid)} className="gap-2">
                            <EyeOff className="h-4 w-4" />
                            Abaikan
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteTarget(n)}
                            className="gap-2 text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                            Hapus…
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      </div>

      {selected && (
        <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
          <DialogContent className="max-w-lg gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-lg">
            <div className="border-b border-border/60 bg-muted/40 px-6 py-4">
              <DialogHeader className="space-y-1 text-left">
                <DialogTitle className="text-lg">Catat transaksi</DialogTitle>
                <DialogDescription>
                  Entri akan dibuat dari notifikasi ini dan saldo akun diperbarui sesuai arah dana.
                </DialogDescription>
              </DialogHeader>
            </div>
            <div className="px-6 py-5">
              <ApproveForm
                notif={selected}
                accounts={accounts}
                onSubmit={(data) => handleApprove(idString(selected._id), data)}
                onCancel={() => {
                  setApproveOpen(false);
                  setSelected(null);
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      <ConfirmDialog
        open={deleteTarget != null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Hapus notifikasi?"
        description={
          deleteTarget ? (
            <span>
              <strong className="text-foreground">{deleteTarget.description}</strong>
              <span className="block pt-1 text-muted-foreground">
                {formatRupiah(deleteTarget.amount)} — tindakan ini tidak bisa dibatalkan.
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

function StatMini({
  icon: Icon,
  label,
  value,
  tone,
  muted,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tone?: "success" | "danger";
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/60 bg-background/90 px-3 py-2.5 text-center shadow-sm backdrop-blur-sm",
        muted && "opacity-90"
      )}
    >
      <Icon
        className={cn(
          "mx-auto mb-1 h-4 w-4",
          tone === "success" && "text-success",
          tone === "danger" && "text-destructive",
          !tone && "text-muted-foreground"
        )}
        aria-hidden
      />
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={cn(
          "text-lg font-bold tabular-nums",
          tone === "success" && "text-success",
          tone === "danger" && "text-destructive"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function ApproveForm({
  notif,
  accounts,
  onSubmit,
  onCancel,
}: {
  notif: EmailNotif;
  accounts: Account[];
  onSubmit: (data: { account_id: string; category: string; description: string }) => void;
  onCancel: () => void;
}) {
  const [accountId, setAccountId] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState(notif.description);

  const categories = [
    { value: "transfer", label: "Transfer" },
    { value: "makan", label: "Makan & Minum" },
    { value: "belanja", label: "Belanja" },
    { value: "top_up", label: "Top Up" },
    { value: "qris", label: "QRIS" },
    { value: "pln", label: "PLN / Listrik" },
    { value: "bpjs", label: "BPJS" },
    { value: "pulsa", label: "Pulsa / Data" },
    { value: "cicilan", label: "Cicilan" },
    { value: "savings", label: "Tabungan" },
    { value: "lainnya", label: "Lainnya" },
    { value: "sewa_masuk", label: "Sewa Masuk" },
    { value: "modal", label: "Modal" },
    { value: "insentif", label: "Insentif" },
    { value: "pengajuan", label: "Pengajuan" },
    { value: "loan", label: "Pinjaman" },
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border/60 bg-muted/25 px-4 py-3 text-sm">
        <p className="font-semibold text-foreground">{formatRupiah(notif.amount)}</p>
        <p className="mt-1 text-muted-foreground">{notif.description}</p>
        <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(notif.parsed_date)}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="approve-account">Akun</Label>
        <Select value={accountId} onValueChange={(v) => setAccountId(v ?? "")}>
          <SelectTrigger id="approve-account" className="h-10 rounded-xl">
            <SelectValue placeholder="Pilih akun…" />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            {accounts.map((a) => (
              <SelectItem key={a._id} value={a._id}>
                {a.holder} ({a.bank}) — {formatRupiah(a.balance)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="approve-category">Kategori</Label>
        <Select value={category} onValueChange={(v) => setCategory(v ?? "")}>
          <SelectTrigger id="approve-category" className="h-10 rounded-xl">
            <SelectValue placeholder="Pilih kategori…" />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            {categories.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="approve-description">Deskripsi</Label>
        <Textarea
          id="approve-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="min-h-[88px] rounded-xl resize-y"
        />
      </div>

      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" className="rounded-xl sm:min-w-[100px]" onClick={onCancel}>
          Batal
        </Button>
        <Button
          type="button"
          className="rounded-xl font-semibold sm:min-w-[140px]"
          disabled={!accountId || !category}
          onClick={() => onSubmit({ account_id: accountId, category, description })}
        >
          Simpan & catat
        </Button>
      </div>
    </div>
  );
}
