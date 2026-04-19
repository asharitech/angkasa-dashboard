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

// ─── Create Button ────────────────────────────────────────────────────────────

export function AgendaCreateButton() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const input: AgendaInput = {
      title: form.get("title") as string,
      description: (form.get("description") as string) || null,
      due_date: form.get("due_date") as string,
      priority: (form.get("priority") as AgendaInput["priority"]) ?? "sedang",
      tags: [],
    };
    setError(null);
    startTransition(async () => {
      const res = await createAgendaAction(input);
      if ("error" in res) {
        setError(res.error);
      } else {
        setOpen(false);
      }
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
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="title">Judul *</Label>
              <Input id="title" name="title" placeholder="Contoh: Rapat pengurus yayasan" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Keterangan</Label>
              <Textarea id="description" name="description" placeholder="Detail opsional..." rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="due_date">Tanggal *</Label>
                <Input id="due_date" name="due_date" type="date" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="priority">Prioritas</Label>
                <Select name="priority" defaultValue="sedang">
                  <SelectTrigger id="priority">
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
            {error && (
              <p className="flex items-center gap-1.5 text-sm text-destructive">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={pending}>
                {pending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                Simpan
              </Button>
            </div>
          </form>
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
  status: AgendaStatus;
  tags?: string[];
  completed_at?: string | null;
}

// ─── Row Actions (toggle checkbox, edit, delete) ──────────────────────────────

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

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const patch: Partial<AgendaInput> = {
      title: form.get("title") as string,
      description: (form.get("description") as string) || null,
      due_date: form.get("due_date") as string,
      priority: form.get("priority") as AgendaInput["priority"],
    };
    setError(null);
    startTransition(async () => {
      const res = await updateAgendaAction(agenda._id, patch);
      if ("error" in res) {
        setError(res.error);
      } else {
        setEditOpen(false);
      }
    });
  }

  async function handleDelete() {
    startTransition(async () => {
      await deleteAgendaAction(agenda._id);
      setDeleteOpen(false);
    });
  }

  return (
    <>
      {/* Toggle checkbox */}
      <button
        onClick={handleToggle}
        disabled={pending}
        title={agenda.status === "belum" ? "Tandai selesai" : "Buka kembali"}
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          agenda.status === "selesai"
            ? "border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-600"
            : "border-muted-foreground/30 text-transparent hover:border-emerald-400 hover:text-emerald-400",
        )}
      >
        <Check className="h-3 w-3" />
      </button>

      {/* Edit button */}
      <button
        onClick={() => setEditOpen(true)}
        title="Edit"
        className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        <Pencil className="h-3 w-3" />
      </button>

      {/* Delete button */}
      <button
        onClick={() => setDeleteOpen(true)}
        title="Hapus"
        className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
      >
        <Trash2 className="h-3 w-3" />
      </button>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Agenda</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-title">Judul *</Label>
              <Input
                id="edit-title"
                name="title"
                defaultValue={agenda.title}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-description">Keterangan</Label>
              <Textarea
                id="edit-description"
                name="description"
                defaultValue={agenda.description ?? ""}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-due_date">Tanggal *</Label>
                <Input
                  id="edit-due_date"
                  name="due_date"
                  type="date"
                  defaultValue={agenda.due_date}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-priority">Prioritas</Label>
                <Select name="priority" defaultValue={agenda.priority}>
                  <SelectTrigger id="edit-priority">
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
            {error && (
              <p className="text-sm text-destructive flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={pending}>
                {pending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                Simpan
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Hapus Agenda?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Agenda{" "}
            <span className="font-medium text-foreground">
              &ldquo;{agenda.title}&rdquo;
            </span>{" "}
            akan dihapus permanen.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Batal
            </Button>
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

// ─── Reopen shortcut ───────────────────────────────────────────────────────────

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
      {pending ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <RotateCcw className="h-3 w-3" />
      )}
      Buka kembali
    </button>
  );
}
