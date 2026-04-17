"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Scale, Loader2 } from "lucide-react";
import { adjustAccountBalanceAction } from "@/lib/actions/accounts";
import { formatRupiah } from "@/lib/format";

interface AccountLite {
  _id: string;
  bank: string;
  balance: number;
}

function AdjustForm({
  account,
  onSuccess,
  onCancel,
}: {
  account: AccountLite;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    newBalance: account.balance.toString(),
    reason: "",
    notes: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const newBalanceNum = Number(form.newBalance);
  const delta = Number.isFinite(newBalanceNum) ? newBalanceNum - account.balance : 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!Number.isFinite(newBalanceNum)) return setError("Saldo baru tidak valid");
    if (!form.reason.trim()) return setError("Alasan wajib diisi");
    if (delta === 0) return setError("Saldo baru sama dengan saldo sekarang");

    start(async () => {
      const result = await adjustAccountBalanceAction({
        accountId: account._id,
        newBalance: newBalanceNum,
        reason: form.reason.trim(),
        notes: form.notes.trim() || undefined,
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
        <p className="text-xs text-muted-foreground">Saldo sekarang</p>
        <p className="font-semibold tabular-nums">{formatRupiah(account.balance)}</p>
      </div>

      <div className="space-y-1.5">
        <Label>Saldo Baru (Rp) *</Label>
        <Input
          type="number"
          inputMode="numeric"
          step="1"
          value={form.newBalance}
          onChange={(e) => setForm((f) => ({ ...f, newBalance: e.target.value }))}
          required
        />
        {Number.isFinite(newBalanceNum) && delta !== 0 && (
          <p
            className={
              delta > 0
                ? "text-xs text-emerald-600"
                : "text-xs text-rose-600"
            }
          >
            {delta > 0 ? "+" : "−"}
            {formatRupiah(Math.abs(delta))} akan dicatat sebagai entry{" "}
            {delta > 0 ? "masuk" : "keluar"} dengan kategori balance_adjustment
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Alasan *</Label>
        <Input
          value={form.reason}
          onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
          placeholder="mis. Sinkron dengan e-statement Okt"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label>Catatan</Label>
        <Textarea
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          rows={2}
          placeholder="Detail tambahan (opsional)"
        />
      </div>

      {error && (
        <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      )}
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
          Batal
        </Button>
        <Button type="submit" className="flex-1" disabled={pending}>
          {pending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
          Sesuaikan
        </Button>
      </div>
    </form>
  );
}

export function AccountAdjustButton({ account }: { account: AccountLite }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const success = () => {
    close();
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setOpen(true)}
        aria-label="Sesuaikan saldo"
        title="Sesuaikan saldo"
      >
        <Scale className="h-4 w-4" />
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sesuaikan Saldo {account.bank}</DialogTitle>
          <DialogDescription>
            Rekonsiliasi saldo dengan e-statement. Selisih akan dicatat sebagai
            entry balance_adjustment supaya audit trail tetap utuh.
          </DialogDescription>
        </DialogHeader>
        <AdjustForm account={account} onSuccess={success} onCancel={close} />
      </DialogContent>
    </Dialog>
  );
}
