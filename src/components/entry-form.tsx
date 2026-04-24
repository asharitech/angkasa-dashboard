"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { createEntryAction, updateEntryAction, type EntryInput } from "@/lib/actions/entries";
import type { Entry, Account } from "@/lib/types";
import { idString } from "@/lib/utils";

const COMMON_CATEGORIES = [
  "konsumsi",
  "transport",
  "operasional",
  "listrik",
  "air",
  "internet",
  "perbaikan",
  "gaji",
  "sewa_masuk",
  "sewa_keluar",
  "setor_tabungan",
  "tarik_tabungan",
  "cicilan",
  "piutang",
  "numpang",
  "lain_lain",
];

function todayIsoWita(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Makassar",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === "year")?.value ?? "1970";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${y}-${m}-${d}`;
}

export function EntryForm({
  entry,
  accounts,
  onSuccess,
  onCancel,
}: {
  entry?: Entry | null;
  accounts: Account[];
  onSuccess: () => void;
  onCancel?: () => void;
}) {
  const isEdit = !!entry;
  const [form, setForm] = useState({
    date: entry?.date?.slice(0, 10) ?? todayIsoWita(),
    account: entry?.account ?? accounts[0]?._id ?? "",
    direction: entry?.direction ?? "out",
    amount: entry?.amount?.toString() ?? "",
    counterparty: entry?.counterparty ?? "",
    description: entry?.description ?? "",
    domain: (entry?.domain as "yayasan" | "personal") ?? "yayasan",
    category: entry?.category ?? "",
    dana_sumber: (entry?.dana_sumber ?? "") as "" | "sewa" | "operasional",
    tahap_sewa: entry?.tahap_sewa ?? "",
    ref_no: entry?.ref_no ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function setField<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const amount = Number(form.amount);
    if (!form.date) return setError("Tanggal wajib diisi");
    if (!form.account) return setError("Akun wajib dipilih");
    if (!Number.isFinite(amount) || amount <= 0) return setError("Jumlah harus > 0");
    if (!form.description.trim()) return setError("Deskripsi wajib diisi");
    if (!form.category.trim()) return setError("Kategori wajib diisi");
    if ((form.dana_sumber === "sewa" || form.category === "sewa_masuk") && !form.tahap_sewa.trim()) {
      return setError("Entry sewa butuh tahap_sewa (contoh: 2026-T6)");
    }

    const payload: EntryInput = {
      date: form.date,
      account: form.account,
      direction: form.direction as "in" | "out",
      amount,
      counterparty: form.counterparty.trim(),
      description: form.description.trim(),
      domain: form.domain,
      category: form.category.trim().toLowerCase().replace(/\s+/g, "_"),
      dana_sumber: form.dana_sumber || null,
      tahap_sewa: form.tahap_sewa.trim() || null,
      ref_no: form.ref_no.trim() || null,
    };

    start(async () => {
      const result = isEdit
        ? await updateEntryAction(idString(entry!._id), payload)
        : await createEntryAction(payload);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      onSuccess();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Tanggal *</Label>
          <Input
            type="date"
            value={form.date}
            onChange={(e) => setField("date", e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label>Arah *</Label>
          <Select
            value={form.direction}
            onValueChange={(v) => setField("direction", ((v ?? "out") as "in" | "out"))}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in">Masuk (in)</SelectItem>
              <SelectItem value="out">Keluar (out)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Akun *</Label>
          <Select
            value={form.account}
            onValueChange={(v) => setField("account", (v ?? "") as string)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih akun" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((a) => (
                <SelectItem key={a._id} value={a._id}>
                  {a.bank}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Jumlah (Rp) *</Label>
          <Input
            type="number"
            inputMode="numeric"
            min="0"
            step="1000"
            value={form.amount}
            onChange={(e) => setField("amount", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Deskripsi *</Label>
        <Input
          value={form.description}
          onChange={(e) => setField("description", e.target.value)}
          placeholder="Contoh: Transfer untuk pembelian ATK"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Lawan Transaksi</Label>
          <Input
            value={form.counterparty}
            onChange={(e) => setField("counterparty", e.target.value)}
            placeholder="Toko/vendor/penerima"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Kategori *</Label>
          <Input
            list="entry-categories"
            value={form.category}
            onChange={(e) => setField("category", e.target.value)}
            placeholder="konsumsi"
            required
          />
          <datalist id="entry-categories">
            {COMMON_CATEGORIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Domain</Label>
          <Select
            value={form.domain}
            onValueChange={(v) =>
              setField("domain", ((v ?? "yayasan") as "yayasan" | "personal"))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yayasan">Yayasan</SelectItem>
              <SelectItem value="personal">Pribadi</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Dana Sumber</Label>
          <Select
            value={form.dana_sumber}
            onValueChange={(v) =>
              setField(
                "dana_sumber",
                ((v ?? "") as "" | "sewa" | "operasional"),
              )
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">—</SelectItem>
              <SelectItem value="operasional">Operasional</SelectItem>
              <SelectItem value="sewa">Sewa (butuh tahap)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {(form.dana_sumber === "sewa" || form.category === "sewa_masuk") && (
        <div className="space-y-1.5">
          <Label>Tahap Sewa *</Label>
          <Input
            value={form.tahap_sewa}
            onChange={(e) => setField("tahap_sewa", e.target.value)}
            placeholder="2026-T6"
            required
          />
        </div>
      )}

      <div className="space-y-1.5">
        <Label>Referensi (opsional)</Label>
        <Textarea
          value={form.ref_no}
          onChange={(e) => setField("ref_no", e.target.value)}
          rows={2}
          placeholder="Nomor struk, transfer, atau catatan"
        />
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      <div className="flex gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
            Batal
          </Button>
        )}
        <Button type="submit" className="flex-1" disabled={pending}>
          {pending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
          {isEdit ? "Simpan Perubahan" : "Tambah Transaksi"}
        </Button>
      </div>
    </form>
  );
}
