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
import { Plus, Pencil, Trash2, CheckCircle2, Loader2 } from "lucide-react";
import { ConfirmDialog } from "@/components/primitives/confirm-dialog";
import {
  createNumpangAction,
  updateNumpangAction,
  settleNumpangAction,
  deleteNumpangAction,
  type NumpangInput,
} from "@/lib/actions/numpang";
import { formatRupiah } from "@/lib/format";
import type { Numpang } from "@/lib/types";
import { idString } from "@/lib/utils";

const PARKED_IN_OPTIONS = [
  { value: "bri_angkasa", label: "BRI Angkasa" },
  { value: "bca_angkasa", label: "BCA Angkasa" },
];

function NumpangForm({
  numpang,
  onSuccess,
  onCancel,
}: {
  numpang?: Numpang | null;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const isEdit = !!numpang;
  const [form, setForm] = useState({
    description: numpang?.description ?? "",
    amount: numpang?.amount?.toString() ?? "",
    parked_in: numpang?.parked_in ?? "bri_angkasa",
    notes: numpang?.notes ?? "",
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
    if (!form.description.trim()) return setError("Deskripsi wajib diisi");
    if (!Number.isFinite(amount) || amount <= 0) return setError("Jumlah harus > 0");
    if (!form.parked_in) return setError("Rekening parkir wajib dipilih");

    const payload: NumpangInput = {
      description: form.description.trim(),
      amount,
      parked_in: form.parked_in,
      notes: form.notes.trim() || undefined,
    };

    start(async () => {
      const result = isEdit
        ? await updateNumpangAction(idString(numpang!._id), payload)
        : await createNumpangAction(payload);
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
        <Label>Deskripsi *</Label>
        <Input
          value={form.description}
          onChange={(e) => setField("description", e.target.value)}
          placeholder="Contoh: Titipan Eba untuk gaji Agus"
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
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label>Rekening Parkir *</Label>
          <Select
            value={form.parked_in}
            onValueChange={(v) => setField("parked_in", (v ?? "") as string)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PARKED_IN_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Catatan</Label>
        <Textarea
          value={form.notes}
          onChange={(e) => setField("notes", e.target.value)}
          rows={2}
          placeholder="Catatan tambahan (opsional)"
        />
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
          {isEdit ? "Simpan Perubahan" : "Tambah Numpang"}
        </Button>
      </div>
    </form>
  );
}

export function NumpangCreateButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const success = () => {
    close();
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Plus className="mr-1 h-3.5 w-3.5" /> Tambah
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Numpang</DialogTitle>
          <DialogDescription>Dana orang lain yang diparkir di rekening pribadi.</DialogDescription>
        </DialogHeader>
        <NumpangForm onSuccess={success} onCancel={close} />
      </DialogContent>
    </Dialog>
  );
}

export function NumpangRowActions({ numpang }: { numpang: Numpang }) {
  const router = useRouter();
  const [open, setOpen] = useState<"edit" | "delete" | "settle" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const close = () => {
    setOpen(null);
    setError(null);
  };
  const success = () => {
    close();
    router.refresh();
  };

  function runAction(fn: () => Promise<{ ok: true } | { error: string }>) {
    setError(null);
    start(async () => {
      const result = await fn();
      if ("error" in result) {
        setError(result.error);
        return;
      }
      success();
    });
  }

  return (
    <div className="flex shrink-0 items-center gap-0.5">
      {numpang.status !== "settled" && (
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-success hover:bg-success/10 hover:text-success"
          onClick={() => setOpen("settle")}
          aria-label="Settle"
          title="Tandai selesai"
        >
          <CheckCircle2 className="h-4 w-4" />
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setOpen("edit")}
        aria-label="Edit"
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={() => setOpen("delete")}
        aria-label="Hapus"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <Dialog open={open === "edit"} onOpenChange={(o) => !o && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Numpang</DialogTitle>
          </DialogHeader>
          <NumpangForm numpang={numpang} onSuccess={success} onCancel={close} />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={open === "settle"}
        onOpenChange={(o) => !o && close()}
        title="Tandai selesai?"
        description={
          <>
            <span className="font-semibold">{numpang.description}</span>
            {" "}({formatRupiah(numpang.amount)}) akan ditandai selesai dan tidak akan dihitung
            di saldo BRI kas.
          </>
        }
        confirmLabel="Tandai Selesai"
        confirmVariant="default"
        icon={CheckCircle2}
        onConfirm={() => runAction(() => settleNumpangAction(idString(numpang._id)))}
        pending={pending}
        error={error}
      />

      <ConfirmDialog
        open={open === "delete"}
        onOpenChange={(o) => !o && close()}
        title="Hapus numpang?"
        description={
          <><span className="font-semibold">{numpang.description}</span> akan dihapus permanen.</>
        }
        confirmLabel="Hapus"
        onConfirm={() => runAction(() => deleteNumpangAction(idString(numpang._id)))}
        pending={pending}
        error={error}
      />
    </div>
  );
}
