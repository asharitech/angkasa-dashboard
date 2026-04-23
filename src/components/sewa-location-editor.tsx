"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, Loader2 } from "lucide-react";
import {
  updateSewaLocationAction,
  type SewaLocationPatch,
} from "@/lib/actions/sewa";
import type { SewaLocation, SewaPipelineStage } from "@/lib/types";

const STAGE_OPTIONS: { value: SewaPipelineStage; label: string }[] = [
  { value: "belum_diterima", label: "Belum Diterima" },
  { value: "di_intermediate", label: "Di Intermediate" },
  { value: "transfer_yayasan", label: "Transfer ke Yayasan" },
  { value: "tercatat", label: "Tercatat" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Aktif" },
  { value: "running", label: "Running" },
  { value: "hold", label: "Hold" },
  { value: "inactive", label: "Inactive" },
];

function Form({
  location,
  onSuccess,
  onCancel,
}: {
  location: SewaLocation;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    days: location.days?.toString() ?? "",
    amount: location.amount?.toString() ?? "",
    status: location.status ?? "active",
    stage: location.pipeline?.stage ?? "belum_diterima",
    holder: location.pipeline?.holder ?? "",
    received_at: location.pipeline?.received_at ?? "",
    notes: location.pipeline?.notes ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function setField<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const daysNum = form.days.trim() === "" ? null : Number(form.days);
    const amountNum = form.amount.trim() === "" ? null : Number(form.amount);
    if (daysNum !== null && (!Number.isFinite(daysNum) || daysNum < 0)) {
      return setError("Hari tidak valid");
    }
    if (amountNum !== null && (!Number.isFinite(amountNum) || amountNum < 0)) {
      return setError("Jumlah tidak valid");
    }

    const patch: SewaLocationPatch = {
      days: daysNum,
      amount: amountNum,
      status: form.status as SewaLocationPatch["status"],
      pipeline: {
        stage: form.stage as SewaPipelineStage,
        holder: form.holder.trim() || null,
        received_at: form.received_at.trim() || null,
        notes: form.notes.trim() || null,
      },
    };

    start(async () => {
      const result = await updateSewaLocationAction(location.code, patch);
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
          <Label>Hari</Label>
          <Input
            type="number"
            inputMode="numeric"
            min="0"
            value={form.days}
            onChange={(e) => setField("days", e.target.value)}
            placeholder="0"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Jumlah (Rp)</Label>
          <Input
            type="number"
            inputMode="numeric"
            min="0"
            step="1000"
            value={form.amount}
            onChange={(e) => setField("amount", e.target.value)}
            placeholder="0"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select
            value={form.status}
            onValueChange={(v) => setField("status", (v ?? "active") as typeof form.status)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Tahap Pipeline</Label>
          <Select
            value={form.stage}
            onValueChange={(v) => setField("stage", (v ?? "belum_diterima") as SewaPipelineStage)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STAGE_OPTIONS.map((o) => (
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
          <Label>Pemegang Dana</Label>
          <Input
            value={form.holder}
            onChange={(e) => setField("holder", e.target.value)}
            placeholder="mis. patta_wellang"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Tanggal Diterima</Label>
          <Input
            type="date"
            value={form.received_at}
            onChange={(e) => setField("received_at", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Catatan Pipeline</Label>
        <Textarea
          value={form.notes}
          onChange={(e) => setField("notes", e.target.value)}
          rows={2}
          placeholder="Catatan tambahan (opsional)"
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
          Simpan
        </Button>
      </div>
    </form>
  );
}

export function SewaLocationEditButton({ location }: { location: SewaLocation }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const success = () => {
    close();
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        className="btn btn--primary btn--sm"
        onClick={() => setOpen(true)}
      >
        Proses
      </button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {location.code}</DialogTitle>
          <DialogDescription>
            Ubah hari, jumlah, status, atau tahap pipeline lokasi ini.
          </DialogDescription>
        </DialogHeader>
        <Form location={location} onSuccess={success} onCancel={close} />
      </DialogContent>
    </Dialog>
  );
}
