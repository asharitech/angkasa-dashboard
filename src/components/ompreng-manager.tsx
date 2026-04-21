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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import {
  upsertOmpreng,
  deleteOmpreng,
} from "@/lib/actions/ompreng";
import {
  DAPUR_LOCATIONS,
  DAPUR_LABELS,
  type DapurLocation,
  type OmprengDoc,
} from "@/lib/ompreng-constants";

const MONTHS = [
  { value: "2026-01", label: "Januari 2026" },
  { value: "2026-02", label: "Februari 2026" },
  { value: "2026-03", label: "Maret 2026" },
  { value: "2026-04", label: "April 2026" },
  { value: "2026-05", label: "Mei 2026" },
  { value: "2026-06", label: "Juni 2026" },
];

function OmprengForm({
  initial,
  onSuccess,
  onCancel,
}: {
  initial?: OmprengDoc;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    dapur: initial?.dapur ?? ("" as DapurLocation | ""),
    month: initial?.month ?? "2026-04",
    jumlah_ompreng: initial?.jumlah_ompreng?.toString() ?? "",
    jumlah_sasaran: initial?.jumlah_sasaran?.toString() ?? "",
    kekurangan_ompreng: initial?.kekurangan_ompreng?.toString() ?? "",
    alasan_tambah: initial?.alasan_tambah ?? "",
    notes: initial?.notes ?? "",
  });
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.dapur) { setError("Pilih dapur"); return; }
    const ompreng = parseInt(form.jumlah_ompreng);
    const sasaran = parseInt(form.jumlah_sasaran);
    if (isNaN(ompreng) || ompreng < 0) { setError("Jumlah ompreng tidak valid"); return; }
    if (isNaN(sasaran) || sasaran < 0) { setError("Jumlah sasaran tidak valid"); return; }
    setError("");
    startTransition(async () => {
      const res = await upsertOmpreng({
        dapur: form.dapur as DapurLocation,
        month: form.month,
        jumlah_ompreng: ompreng,
        jumlah_sasaran: sasaran,
        kekurangan_ompreng: form.kekurangan_ompreng ? parseInt(form.kekurangan_ompreng) : 0,
        alasan_tambah: form.alasan_tambah,
        notes: form.notes,
      });
      if ("error" in res) { setError(res.error); return; }
      onSuccess();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Dapur</Label>
          <Select
            value={form.dapur}
            onValueChange={(v) => setForm((f) => ({ ...f, dapur: v as DapurLocation }))}
          >
            <SelectTrigger><SelectValue placeholder="Pilih dapur…" /></SelectTrigger>
            <SelectContent>
              {DAPUR_LOCATIONS.map((d) => (
                <SelectItem key={d} value={d}>{DAPUR_LABELS[d]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Bulan</Label>
          <Select
            value={form.month}
            onValueChange={(v) => setForm((f) => ({ ...f, month: v ?? "2026-04" }))}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {MONTHS.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Jumlah Ompreng</Label>
          <Input
            type="number" min={0}
            value={form.jumlah_ompreng}
            onChange={(e) => setForm((f) => ({ ...f, jumlah_ompreng: e.target.value }))}
            placeholder="0"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Jumlah Sasaran</Label>
          <Input
            type="number" min={0}
            value={form.jumlah_sasaran}
            onChange={(e) => setForm((f) => ({ ...f, jumlah_sasaran: e.target.value }))}
            placeholder="0"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Kekurangan Ompreng <span className="text-muted-foreground text-xs">(opsional)</span></Label>
        <Input
          type="number" min={0}
          value={form.kekurangan_ompreng}
          onChange={(e) => setForm((f) => ({ ...f, kekurangan_ompreng: e.target.value }))}
          placeholder="0"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Alasan Tambah Ompreng <span className="text-muted-foreground text-xs">(opsional)</span></Label>
        <Textarea
          rows={2}
          value={form.alasan_tambah}
          onChange={(e) => setForm((f) => ({ ...f, alasan_tambah: e.target.value }))}
          placeholder="Misal: panci rusak 3 unit, butuh tambah untuk dapur baru..."
        />
      </div>
      <div className="space-y-1.5">
        <Label>Catatan <span className="text-muted-foreground text-xs">(opsional)</span></Label>
        <Textarea
          rows={2}
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          placeholder="Catatan tambahan…"
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Simpan
        </Button>
      </div>
    </form>
  );
}

export function OmprengAddButton() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" /> Tambah Data
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tambah Data Ompreng</DialogTitle></DialogHeader>
          <OmprengForm
            onSuccess={() => { setOpen(false); router.refresh(); }}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

export function OmprengRowActions({ row }: { row: OmprengDoc }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    if (!row._id) return;
    startTransition(async () => {
      await deleteOmpreng(row._id!);
      setDeleteOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditOpen(true)}>
        <Pencil className="h-3.5 w-3.5" />
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteOpen(true)}>
        <Trash2 className="h-3.5 w-3.5" />
      </Button>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Data Ompreng</DialogTitle></DialogHeader>
          <OmprengForm
            initial={row}
            onSuccess={() => { setEditOpen(false); router.refresh(); }}
            onCancel={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Hapus Data?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Data ompreng <strong>{DAPUR_LABELS[row.dapur]}</strong> bulan <strong>{row.month}</strong> akan dihapus permanen.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Batal</Button>
            <Button variant="destructive" disabled={isPending} onClick={handleDelete}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hapus
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
