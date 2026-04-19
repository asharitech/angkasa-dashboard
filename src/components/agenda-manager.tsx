"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  createAgendaAction,
  updateAgendaAction,
  deleteAgendaAction,
  toggleAgendaStatusAction,
  type AgendaInput,
  type AgendaStatus,
  type AgendaKategori,
} from "@/lib/actions/agenda";
import {
  Plus,
  Check,
  Trash2,
  Pencil,
  RotateCcw,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const KATEGORI_CONFIG: Record<
  AgendaKategori,
  { label: string; emoji: string; cls: string }
> = {
  yayasan:     { label: "Yayasan",     emoji: "🏛️", cls: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" },
  keuangan:    { label: "Keuangan",    emoji: "💰", cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  pribadi:     { label: "Pribadi",     emoji: "👤", cls: "bg-sky-500/10 text-sky-600 border-sky-500/20" },
  operasional: { label: "Operasional", emoji: "⚙️", cls: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
  rapat:       { label: "Rapat",       emoji: "📋", cls: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  perjalanan:  { label: "Perjalanan",  emoji: "🚗", cls: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  lainnya:     { label: "Lainnya",     emoji: "📌", cls: "bg-slate-500/10 text-slate-600 border-slate-500/20" },
};

function AgendaForm({
  defaultValues,
  onSubmit,
  onCancel,
  pending,
  error,
}: {
  defaultValues?: Partial<AgendaInput>;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  pending: boolean;
  error: string | null;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4 pt-2">
      <div className="space-y-1.5">
        <Label htmlFor="a-title">Judul *</Label>
        <Input
          id="a-title"
          name="title"
          placeholder="Contoh: Rapat pengurus yayasan"
          defaultValue={defaultValues?.title ?? ""}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="a-description">Keterangan / Detail</Label>
        <Textarea
          id="a-description"
          name="description"
          placeholder="Detail item, catatan, lokasi, dll..."
          defaultValue={defaultValues?.description ?? ""}
          rows={3}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="a-due_date">Deadline *</Label>
          <Input
            id="a-due_date"
            name="due_date"
            type="date"
            defaultValue={defaultValues?.due_date ?? ""}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="a-priority">Prioritas</Label>
          <Select name="priority" defaultValue={defaultValues?.priority ?? "sedang"}>
            <SelectTrigger id="a-priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tinggi">🔴 Tinggi</SelectItem>
              <SelectItem value="sedang">🟡 Sedang</SelectItem>
              <SelectItem value="rendah">🟢 Rendah</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="a-kategori">Kategori</Label>
        <Select name="kategori" defaultValue={defaultValues?.kategori ?? "lainnya"}>
          <SelectTrigger id="a-kategori">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(KATEGORI_CONFIG) as [AgendaKategori, typeof KATEGORI_CONFIG[AgendaKategori]][]).map(
              ([key, cfg]) => (
                <SelectItem key={key} value={key}>
                  {cfg.emoji} {cfg.label}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      </div>
      {error && (
        <p className="flex items-center gap-1.5 text-sm text-destructive">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
          Simpan
        </Button>
      </div>
    </form>
  );
}

// ─── Create Button ────────────────────────────────────────────────────────────

export function AgendaCreateButton() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const input: AgendaInput = {
      title: form.get("title") as string,
      description: (form.get("description") as string) || null,
      due_date: form.get("due_date") as string,
      priority: form.get("priority") as AgendaInput["priority"],
      kategori: form.get("kategori") as AgendaKategori,
    };
    setError(null);
    startTransition(async () => {
      const res = await createAgendaAction(input);
      if ("error" in res) setError(res.error);
      else setOpen(false);
    });
  }

  return (
    <>
      <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Tambah Agenda
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Agenda Baru</DialogTitle>
          </DialogHeader>
          <AgendaForm
            onSubmit={handleSubmit}
            onCancel={() => setOpen(false)}
            pending={pending}
            error={error}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AgendaDoc {
  _id: string;
  title: string;
  description?: string | null;
  due_date: string;
  priority: "tinggi" | "sedang" | "rendah";
  kategori?: AgendaKategori;
  status: AgendaStatus;
  tags?: string[];
  completed_at?: string | null;
}

// ─── Row Actions ──────────────────────────────────────────────────────────────

export function AgendaRowActions({ agenda }: { agenda: AgendaDoc }) {
  const [pending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleToggle() {
    startTransition(async () => {
      await toggleAgendaStatusAction(agenda._id, agenda.status);
    });
  }

  function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const patch: Partial<AgendaInput> = {
      title: form.get("title") as string,
      description: (form.get("description") as string) || null,
      due_date: form.get("due_date") as string,
      priority: form.get("priority") as AgendaInput["priority"],
      kategori: form.get("kategori") as AgendaKategori,
    };
    setError(null);
    startTransition(async () => {
      const res = await updateAgendaAction(agenda._id, patch);
      if ("error" in res) setError(res.error);
      else setEditOpen(false);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteAgendaAction(agenda._id);
      setDeleteOpen(false);
    });
  }

  return (
    <>
      {/* Checkbox toggle */}
      <button
        onClick={handleToggle}
        disabled={pending}
        title={agenda.status === "belum" ? "Tandai selesai" : "Buka kembali"}
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-150",
          agenda.status === "selesai"
            ? "border-emerald-500 bg-emerald-500 text-white"
            : "border-muted-foreground/40 text-transparent hover:border-emerald-400 hover:text-emerald-400",
          pending && "opacity-50 cursor-wait",
        )}
      >
        <Check className="h-2.5 w-2.5" strokeWidth={3} />
      </button>

      {/* Edit */}
      <button
        onClick={() => setEditOpen(true)}
        title="Edit"
        className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/60 hover:bg-muted hover:text-foreground transition-colors"
      >
        <Pencil className="h-3 w-3" />
      </button>

      {/* Delete */}
      <button
        onClick={() => setDeleteOpen(true)}
        title="Hapus"
        className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/60 hover:bg-destructive/10 hover:text-destructive transition-colors"
      >
        <Trash2 className="h-3 w-3" />
      </button>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Agenda</DialogTitle>
          </DialogHeader>
          <AgendaForm
            defaultValues={{
              title: agenda.title,
              description: agenda.description ?? "",
              due_date: agenda.due_date,
              priority: agenda.priority,
              kategori: agenda.kategori ?? "lainnya",
            }}
            onSubmit={handleEdit}
            onCancel={() => setEditOpen(false)}
            pending={pending}
            error={error}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Hapus Agenda?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">&ldquo;{agenda.title}&rdquo;</span>{" "}
            akan dihapus permanen.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={pending}>
              {pending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Hapus
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Reopen ───────────────────────────────────────────────────────────────────

export function AgendaReopenButton({ id, status }: { id: string; status: AgendaStatus }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      onClick={() =>
        startTransition(async () => {
          await toggleAgendaStatusAction(id, status);
        })
      }
      disabled={pending}
      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
      Buka kembali
    </button>
  );
}
