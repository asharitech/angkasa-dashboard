"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatRupiah, formatDateShort, formatMonthCodeLong } from "@/lib/format";
import { idString } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/section-card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createEntryAction,
  updateEntryAction,
  deleteEntryAction,
} from "@/lib/actions/entries";
import { EmptyState } from "@/components/empty-state";
import { Wallet, Receipt, CalendarDays, Tag, Plus, Pencil, Trash2, CalendarX2 } from "lucide-react";
import type { Entry } from "@/lib/types";
import type { Account } from "@/lib/types";

const LABEL_ORDER = [
  "makan_minum",
  "grab_gojek",
  "belanja",
  "top_up",
  "pulsa",
  "cicilan",
  "savings",
  "lainnya",
] as const;

type LabelKey = (typeof LABEL_ORDER)[number];

const LABEL_CONFIG: Record<
  LabelKey,
  { label: string; color: Parameters<typeof Badge>[0]["variant"] }
> = {
  makan_minum: { label: "Makan / Minum", color: "warning" },
  grab_gojek: { label: "Grab / Gojek", color: "info" },
  belanja: { label: "Belanja", color: "default" },
  top_up: { label: "Top Up", color: "success" },
  pulsa: { label: "Pulsa", color: "secondary" },
  cicilan: { label: "Cicilan", color: "destructive" },
  savings: { label: "Tabungan", color: "success" },
  lainnya: { label: "Lainnya", color: "outline" },
};

const CATEGORIES = [
  { value: "makan", label: "Makan / Minum" },
  { value: "belanja", label: "Belanja" },
  { value: "qris", label: "QRIS" },
  { value: "top_up", label: "Top Up" },
  { value: "transfer", label: "Transfer" },
  { value: "pln", label: "PLN / Listrik" },
  { value: "bpjs", label: "BPJS" },
  { value: "pulsa", label: "Pulsa / Data" },
  { value: "cicilan", label: "Cicilan" },
  { value: "savings", label: "Tabungan" },
  { value: "lainnya", label: "Lainnya" },
];

function getLabel(entry: { category: string | null; description: string }): LabelKey {
  const desc = (entry.description ?? "").toLowerCase();
  const cat = entry.category ?? "";

  if (desc.includes("grab") || desc.includes("gojek")) return "grab_gojek";
  if (
    desc.includes("top up") ||
    desc.includes("topup") ||
    desc.includes("shopeepay") ||
    desc.includes("ovo") ||
    desc.includes("gopay") ||
    desc.includes("dana")
  )
    return "top_up";
  if (cat === "pulsa") return "pulsa";
  if (cat === "cicilan" || cat === "loan") return "cicilan";
  if (cat === "savings") return "savings";
  if (cat === "makan" || cat === "makan_minum") return "makan_minum";
  if (cat === "belanja" || cat === "gym") return "belanja";

  return "lainnya";
}

interface PribadiClientProps {
  entries: Entry[];
  entriesOut: Entry[];
  months: string[];
  cashflowByMonth: Record<string, { in: number; out: number }>;
  activeMonth: string;
  activeLabel?: LabelKey;
  accounts: Account[];
}

export function PribadiClient({
  entries,
  entriesOut: _entriesOut,
  months,
  cashflowByMonth,
  activeMonth,
  activeLabel,
  accounts,
}: PribadiClientProps) {
  const items = entries;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [form, setForm] = useState({
    date: "",
    account: "bri_angkasa",
    direction: "out" as "in" | "out",
    amount: "",
    counterparty: "",
    description: "",
    domain: "personal",
    category: "makan",
  });

  const resetForm = (entry?: Entry) => {
    if (entry) {
      setForm({
        date: entry.date ? (typeof entry.date === "string" ? entry.date : new Date(entry.date).toISOString().substring(0, 10)) : "",
        account: entry.account ?? "bri_angkasa",
        direction: (entry.direction as "in" | "out") ?? "out",
        amount: String(entry.amount ?? ""),
        counterparty: entry.counterparty ?? "",
        description: entry.description ?? "",
        domain: entry.domain ?? "personal",
        category: entry.category ?? "makan",
      });
    } else {
      setForm({
        date: new Date().toISOString().substring(0, 10),
        account: "bri_angkasa",
        direction: "out",
        amount: "",
        counterparty: "",
        description: "",
        domain: "personal",
        category: "makan",
      });
    }
  };

  const handleCreate = async () => {
    setLoading(true);
    const result = await createEntryAction({
      date: form.date,
      account: form.account,
      direction: form.direction,
      amount: parseInt(form.amount.replace(/\./g, ""), 10) || 0,
      counterparty: form.counterparty,
      description: form.description,
      domain: form.domain,
      category: form.category,
    });
    if (result.ok) {
      setDialogOpen(false);
      resetForm();
      // Refresh page to get new data
      window.location.reload();
    }
    setLoading(false);
  };

  const handleUpdate = async () => {
    if (!editingEntry) return;
    setLoading(true);
    await updateEntryAction(idString(editingEntry._id), {
      date: form.date,
      account: form.account,
      direction: form.direction,
      amount: parseInt(form.amount.replace(/\./g, ""), 10) || 0,
      counterparty: form.counterparty,
      description: form.description,
      domain: form.domain,
      category: form.category,
    });
    setDialogOpen(false);
    setEditingEntry(null);
    resetForm();
    window.location.reload();
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus transaksi ini?")) return;
    setLoading(true);
    await deleteEntryAction(id);
    window.location.reload();
    setLoading(false);
  };

  const openEdit = (entry: Entry) => {
    setEditingEntry(entry);
    resetForm(entry);
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditingEntry(null);
    resetForm();
    setDialogOpen(true);
  };

  // Compute label totals
  const labelTotals = new Map<LabelKey, { total: number; count: number }>();
  for (const key of LABEL_ORDER) {
    labelTotals.set(key, { total: 0, count: 0 });
  }
  for (const e of items.filter((e) => e.direction === "out")) {
    const key = getLabel(e);
    const cur = labelTotals.get(key) ?? { total: 0, count: 0 };
    cur.total += e.amount;
    cur.count += 1;
    labelTotals.set(key, cur);
  }

  const filteredEntries = activeLabel
    ? items.filter((e) => e.direction === "out" && getLabel(e) === activeLabel)
    : items.filter((e) => e.direction === "out");

  const totalOut = items
    .filter((e) => e.direction === "out")
    .reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold tracking-tight md:text-2xl flex items-center gap-2">
          <Wallet className="h-6 w-6 text-primary shrink-0" />
          Pengeluaran Angkasa
        </h2>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" />
          Tambah
        </Button>
      </div>

      {/* Month List */}
      {months.length === 0 ? (
        <EmptyState
          icon={CalendarX2}
          title="Belum ada transaksi pribadi"
          description="Tambah pengeluaran pertama untuk mulai melacak per bulan. Data akan muncul di sini setelah tercatat di basis data."
          tone="muted"
          action={
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1" />
              Tambah transaksi
            </Button>
          }
        />
      ) : (
        <div className="max-h-[min(420px,55vh)] space-y-2 overflow-y-auto overscroll-contain pr-0.5 md:max-h-none md:overflow-visible">
          {months.map((m) => {
            const active = m === activeMonth;
            const cfMonth = cashflowByMonth[m] ?? { in: 0, out: 0 };
            return (
              <Link
                key={m}
                href={`/pribadi?bulan=${m}${activeLabel ? `&label=${activeLabel}` : ""}`}
                className={cn(
                  "block rounded-xl border px-4 py-3 transition-all",
                  active
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card border-border hover:border-primary/40 hover:shadow-sm"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cn("font-semibold", active ? "text-primary-foreground" : "text-foreground")}>
                    {formatMonthCodeLong(m)}
                  </span>
                  <span className={cn("text-sm font-bold tabular-nums", active ? "text-primary-foreground/90" : "text-destructive")}>
                    {formatRupiah(cfMonth.out)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className={cn("text-xs", active ? "text-primary-foreground/70" : "text-muted-foreground")}>
                    {cfMonth.in > 0 && <>masuk {formatRupiah(cfMonth.in)} · </>}
                    keluar {formatRupiah(cfMonth.out)}
                  </span>
                  <span className={cn("text-xs tabular-nums", active ? "text-primary-foreground/70" : "text-muted-foreground")}>
                    {cfMonth.in - cfMonth.out >= 0 ? "+" : ""}
                    {formatRupiah(cfMonth.in - cfMonth.out)}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Total Card */}
      <SectionCard title={`Total Pengeluaran — ${formatMonthCodeLong(activeMonth)}`} tone="danger" bodyClassName="py-3">
        <p className="text-2xl font-extrabold tabular-nums text-destructive">
          {formatRupiah(totalOut)}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {items.filter((e) => e.direction === "out").length} transaksi
        </p>
      </SectionCard>

      {/* Label Filters */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Tag className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Label Pengeluaran</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/pribadi?bulan=${activeMonth}`}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all border",
              !activeLabel
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:border-primary/50"
            )}
          >
            Semua
          </Link>
          {LABEL_ORDER.map((key) => {
            const config = LABEL_CONFIG[key];
            const { total } = labelTotals.get(key) ?? { total: 0, count: 0 };
            if (total === 0) return null;
            const isActive = activeLabel === key;
            return (
              <Link
                key={key}
                href={`/pribadi?bulan=${activeMonth}&label=${key}`}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all border flex items-center gap-1.5",
                  isActive
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary/50"
                )}
              >
                {config.label}
                <span className={cn("tabular-nums", isActive ? "text-primary-foreground/70" : "text-muted-foreground/60")}>
                  {formatRupiah(total).replace("Rp", "").trim()}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Transaction List */}
      <SectionCard icon={CalendarDays} title="Detail Transaksi" tone="muted">
        {filteredEntries.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-sm">
            Tidak ada transaksi untuk filter ini.
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {filteredEntries.map((entry) => {
              const labelKey = getLabel(entry);
              const labelConfig = LABEL_CONFIG[labelKey];
              return (
                <div
                  key={idString(entry._id)}
                  className={cn(
                    "flex items-center justify-between gap-3 py-3",
                    entry.is_virtual && "opacity-80"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">
                      {entry.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {formatDateShort(entry.date)}
                      </span>
                      <Badge variant={labelConfig.color} className="text-[10px] h-5 px-1.5">
                        {labelConfig.label}
                      </Badge>
                      {entry.is_virtual && (
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-primary/20 bg-primary/5 text-primary">
                          PAID
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-bold tabular-nums text-destructive">
                      -{formatRupiah(entry.amount)}
                    </span>
                    {!entry.is_virtual && (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => openEdit(entry)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(idString(entry._id))}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* Label Summary */}
      <SectionCard icon={Receipt} title="Rincian per Label" tone="info">
        <div className="divide-y divide-border/50">
          {LABEL_ORDER.map((key) => {
            const config = LABEL_CONFIG[key];
            const { total, count } = labelTotals.get(key) ?? { total: 0, count: 0 };
            if (total === 0) return null;
            const isActive = !activeLabel || activeLabel === key;
            return (
              <div
                key={key}
                className={cn("flex items-center justify-between py-2.5", !isActive && "opacity-40")}
              >
                <div className="flex items-center gap-2">
                  <Badge variant={config.color} className="text-[10px] h-5 px-1.5">
                    {config.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{count}x</span>
                </div>
                <span className="text-sm font-bold tabular-nums text-destructive">
                  {formatRupiah(total)}
                </span>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingEntry ? "Edit Transaksi" : "Tambah Transaksi"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Tanggal</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Nominal</Label>
                <Input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="Rp"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Akun</Label>
              <Select
                value={form.account}
                onValueChange={(v) => setForm({ ...form, account: v ?? "" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a._id} value={a._id}>
                      {a.holder} ({a.bank})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Deskripsi</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Contoh: Makan siang di Gacoan"
              />
            </div>

            <div className="space-y-1">
              <Label>Kategori</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v ?? "" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Counterparty</Label>
              <Input
                value={form.counterparty}
                onChange={(e) => setForm({ ...form, counterparty: e.target.value })}
                placeholder="Nama penerima / toko"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button
                disabled={!form.date || !form.amount || !form.description || loading}
                onClick={editingEntry ? handleUpdate : handleCreate}
              >
                {loading ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
