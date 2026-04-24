"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { EntryForm } from "./entry-form";
import { ConfirmDialog } from "@/components/primitives/confirm-dialog";
import { deleteEntryAction, getEntryByIdAction } from "@/lib/actions/entries";
import type { Entry, Account } from "@/lib/types";

type DialogKind = "edit" | "delete" | null;

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
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
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
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
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

      <ConfirmDialog
        open={open === "delete"}
        onOpenChange={(o) => !o && close()}
        title="Hapus transaksi?"
        description="Aksi ini tidak bisa dibatalkan dan akan memengaruhi saldo rekening."
        confirmLabel="Hapus"
        onConfirm={confirmDelete}
        pending={pending}
        error={error}
      />
    </div>
  );
}

export function EntryCreateButton({ accounts }: { accounts: Account[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const success = () => {
    close();
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" onClick={() => setOpen(true)}>
        + Tambah Transaksi
      </Button>
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
