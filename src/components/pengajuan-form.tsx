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
import { idString } from "@/lib/utils";

const SUMBER_DANA_OPTIONS = [
  { value: "BRI_ANGKASA", label: "BRI Angkasa" },
  { value: "BCA_ANGKASA", label: "BCA Angkasa" },
  { value: "BTN_YAYASAN", label: "BTN Yayasan" },
  { value: "CASH_YAYASAN", label: "Cash Yayasan" },
  { value: "DANA_SEWA", label: "Dana Sewa" },
];

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
    sumber_dana: obligation?.sumber_dana ?? "BRI_ANGKASA",
    month: obligation?.month ?? "",
    date_spent: obligation?.date_spent?.slice(0, 10) ?? "",
    bukti_ref: obligation?.bukti_ref ?? "",
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

      {error && (
        <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
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
