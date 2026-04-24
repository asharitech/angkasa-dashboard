"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { markLunasAction } from "@/lib/actions/obligations";
import { formatRupiah } from "@/lib/format";
import type { Obligation, Account } from "@/lib/types";
import { idString } from "@/lib/utils";

const DANA_SUMBER_OPTIONS = [
  { value: "", label: "— (Operasional umum)" },
  { value: "operasional", label: "Operasional" },
  { value: "sewa", label: "Sewa (butuh tahap)" },
];

function todayIsoWita(): string {
  // Asia/Makassar date for the default
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

export function MarkLunasForm({
  obligation,
  accounts,
  onSuccess,
  onCancel,
}: {
  obligation: Obligation;
  accounts: Account[];
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    account: accounts[0]?._id ?? "",
    date: todayIsoWita(),
    amount: obligation.amount?.toString() ?? "",
    description: "",
    dana_sumber: "",
    tahap_sewa: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function setField<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.account) return setError("Akun wajib dipilih");
    if (!form.date) return setError("Tanggal wajib diisi");
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) return setError("Jumlah harus > 0");
    if (form.dana_sumber === "sewa" && !form.tahap_sewa.trim()) {
      return setError("Tahap sewa wajib diisi (contoh: 2026-T6)");
    }

    start(async () => {
      const result = await markLunasAction({
        obligationId: idString(obligation._id),
        account: form.account,
        date: form.date,
        amount,
        description: form.description.trim() || undefined,
        dana_sumber: (form.dana_sumber || null) as "sewa" | "operasional" | null,
        tahap_sewa: form.dana_sumber === "sewa" ? form.tahap_sewa.trim() : null,
      });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      onSuccess();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="rounded-md bg-muted/50 px-3 py-2 text-sm">
        <p className="font-semibold">{obligation.item}</p>
        {obligation.amount != null && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            Jumlah pengajuan: {formatRupiah(obligation.amount)}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Akun Sumber *</Label>
          <Select value={form.account} onValueChange={(v) => setField("account", (v ?? "") as string)}>
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
          <Label>Tanggal *</Label>
          <Input
            type="date"
            value={form.date}
            onChange={(e) => setField("date", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Jumlah Bayar (Rp) *</Label>
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

      <div className="space-y-1.5">
        <Label>Deskripsi (opsional)</Label>
        <Input
          value={form.description}
          onChange={(e) => setField("description", e.target.value)}
          placeholder={`Default: ${obligation.item}`}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Dana Sumber</Label>
          <Select
            value={form.dana_sumber}
            onValueChange={(v) => setField("dana_sumber", (v ?? "") as string)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DANA_SUMBER_OPTIONS.map((o) => (
                <SelectItem key={o.value || "none"} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {form.dana_sumber === "sewa" && (
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
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
          Batal
        </Button>
        <Button type="submit" className="flex-1" disabled={pending}>
          {pending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
          Tandai Lunas
        </Button>
      </div>
    </form>
  );
}
