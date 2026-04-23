"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, Trash2, Loader2, AlertTriangle, Plus } from "lucide-react";
import { EntryForm } from "./entry-form";
import { deleteEntryAction, getEntryByIdAction } from "@/lib/actions/entries";
import { createEntryAction as _createEntry } from "@/lib/actions/entries";
import type { Entry, Account } from "@/lib/types";

type DialogKind = "edit" | "delete" | null;

void _createEntry;

export function EntryRowActions({
  entryId,
  accounts,
  hasObligationLink,
}: {
  entryId: string;
  accounts: Account[];
  hasObligationLink?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState<DialogKind>(null);
  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const close = () => {
    setOpen(null);
    setError(null);
    setEntry(null);
  };
  const success = () => {
    close();
    router.refresh();
  };

  async function openEdit() {
    setOpen("edit");
    setLoading(true);
    setError(null);
    const result = await getEntryByIdAction(entryId);
    if ("error" in result) {
      setError(result.error);
    } else {
      setEntry(result.entry);
    }
    setLoading(false);
  }

  function confirmDelete() {
    setError(null);
    start(async () => {
      const result = await deleteEntryAction(entryId);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      success();
    });
  }

  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={openEdit}
        aria-label="Edit"
        title="Edit"
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        className="text-destructive hover:bg-rose-50 hover:text-destructive"
        onClick={() => setOpen("delete")}
        aria-label="Hapus"
        title={hasObligationLink ? "Terkait pengajuan lunas" : "Hapus"}
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <Dialog open={open === "edit"} onOpenChange={(o) => !o && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transaksi</DialogTitle>
          </DialogHeader>
          {loading && (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {error && !loading && (
            <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
          )}
          {entry && !loading && (
            <EntryForm
              entry={entry}
              accounts={accounts}
              onSuccess={success}
              onCancel={close}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={open === "delete"}
        onOpenChange={(o) => {
          if (!o && !pending) close();
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <DialogTitle>Hapus transaksi?</DialogTitle>
            </div>
            <DialogDescription>
              Aksi ini tidak bisa dibatalkan dan akan memengaruhi saldo rekening.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <p className="rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={close} disabled={pending}>
              Batal
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={pending}>
              {pending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function EntryCreateButton({ accounts, label = "Tambah Transaksi" }: { accounts: Account[]; label?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const success = () => {
    close();
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button className="btn btn--primary" onClick={() => setOpen(true)}>
        <Plus className="btn__icon" /> {label}
      </button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Transaksi</DialogTitle>
          <DialogDescription>Catat entry masuk/keluar secara manual.</DialogDescription>
        </DialogHeader>
        <EntryForm accounts={accounts} onSuccess={success} onCancel={close} />
      </DialogContent>
    </Dialog>
  );
}
