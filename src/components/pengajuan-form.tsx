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
import {
  createObligationAction,
  updateObligationAction,
  type PengajuanInput,
} from "@/lib/actions/obligations";
import type { Obligation } from "@/lib/types";
import type { DetailItem } from "@/lib/types";
import { idString } from "@/lib/utils";
import { FUND_SOURCES } from "@/lib/config";
import { formatFundSource } from "@/lib/names";
import { Plus, X } from "lucide-react";

const SUMBER_DANA_OPTIONS = FUND_SOURCES.map((v) => ({ value: v, label: formatFundSource(v) }));

const COMMON_CATEGORIES = [
  "konsumsi",
  "transport",
  "operasional",
  "listrik",
  "air",
  "internet",
  "perbaikan",
  "alat_kerja",
  "administrasi",
  "lain_lain",
];

export function PengajuanForm({
  obligation,
  onSuccess,
  onCancel,
}: {
  obligation?: Obligation | null;
  onSuccess: () => void;
  onCancel?: () => void;
}) {
  const isEdit = !!obligation;
  const [form, setForm] = useState({
    item: obligation?.item ?? "",
    amount: obligation?.amount?.toString() ?? "",
    category: obligation?.category ?? "",
    requestor: obligation?.requestor ?? "",
    sumber_dana: obligation?.sumber_dana ?? "BTN_YAYASAN",
    month: obligation?.month ?? "",
    date_spent: obligation?.date_spent ? new Date(obligation.date_spent).toISOString().slice(0, 10) : "",
    bukti_ref: obligation?.bukti_ref ?? "",
  });
  const [details, setDetails] = useState<DetailItem[]>(obligation?.detail ?? []);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function addDetail() {
    setDetails((d) => [...d, { item: "", amount: 0 }]);
  }
  function removeDetail(i: number) {
    setDetails((d) => d.filter((_, idx) => idx !== i));
  }
  function updateDetail(i: number, field: keyof DetailItem, value: string | number) {
    setDetails((d) => d.map((row, idx) => idx === i ? { ...row, [field]: value } : row));
  }

  function setField<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const amount = Number(form.amount);
    if (!form.item.trim()) return setError("Item wajib diisi");
    if (!Number.isFinite(amount) || amount <= 0) return setError("Jumlah harus > 0");
    if (!form.category.trim()) return setError("Kategori wajib diisi");

    const payload: PengajuanInput = {
      type: "pengajuan",
      item: form.item.trim(),
      amount,
      category: form.category.trim().toLowerCase().replace(/\s+/g, "_"),
      requestor: form.requestor.trim() || undefined,
      sumber_dana: form.sumber_dana || null,
      month: form.month || null,
      date_spent: form.date_spent || null,
      bukti_ref: form.bukti_ref.trim() || null,
      detail: details.length > 0 ? details.filter((d) => d.item.trim()) : undefined,
    };

    start(async () => {
      const result = isEdit
        ? await updateObligationAction(idString(obligation!._id), payload)
        : await createObligationAction(payload);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      onSuccess();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Item *</Label>
        <Input
          value={form.item}
          onChange={(e) => setField("item", e.target.value)}
          placeholder="Contoh: Konsumsi rapat kamis"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Jumlah (Rp) *</Label>
          <Input
            type="number"
            inputMode="numeric"
            min="0"
            step="1000"
            value={form.amount}
            onChange={(e) => setField("amount", e.target.value)}
            placeholder="500000"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label>Kategori *</Label>
          <Input
            list="pengajuan-categories"
            value={form.category}
            onChange={(e) => setField("category", e.target.value)}
            placeholder="konsumsi"
            required
          />
          <datalist id="pengajuan-categories">
            {COMMON_CATEGORIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Requestor</Label>
          <Input
            value={form.requestor}
            onChange={(e) => setField("requestor", e.target.value)}
            placeholder="angkasa"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Sumber Dana *</Label>
          <Select
            value={form.sumber_dana || ""}
            onValueChange={(v) => setField("sumber_dana", (v ?? "") as string)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUMBER_DANA_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Bulan</Label>
          <Input
            type="month"
            value={form.month ?? ""}
            onChange={(e) => setField("month", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Tanggal Belanja</Label>
          <Input
            type="date"
            value={form.date_spent ?? ""}
            onChange={(e) => setField("date_spent", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Referensi Bukti</Label>
        <Textarea
          value={form.bukti_ref ?? ""}
          onChange={(e) => setField("bukti_ref", e.target.value)}
          placeholder="Nota, nomor transfer, atau catatan"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Rincian (opsional)</Label>
          <Button type="button" size="sm" variant="outline" onClick={addDetail}>
            <Plus className="mr-1 h-3 w-3" />
            Tambah Baris
          </Button>
        </div>
        {details.map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              placeholder="Nama item"
              value={d.item}
              onChange={(e) => updateDetail(i, "item", e.target.value)}
              className="flex-1"
            />
            <Input
              type="number"
              inputMode="numeric"
              placeholder="Nominal"
              value={d.amount || ""}
              onChange={(e) => updateDetail(i, "amount", parseInt(e.target.value) || 0)}
              className="w-28"
            />
            <Button type="button" size="icon-sm" variant="ghost" onClick={() => removeDetail(i)}>
              <X className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
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
          {isEdit ? "Simpan Perubahan" : "Tambah Pengajuan"}
        </Button>
      </div>
    </form>
  );
}
