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
import { Pencil, Trash2, CheckCircle2 } from "lucide-react";
import { PengajuanForm } from "./pengajuan-form";
import { MarkLunasForm } from "./mark-lunas-form";
import { ConfirmDialog } from "@/components/primitives/confirm-dialog";
import { deleteObligationAction } from "@/lib/actions/obligations";
import type { Obligation, Account } from "@/lib/types";
import { idString } from "@/lib/utils";

type DialogKind = "edit" | "delete" | "lunas" | null;

export function PengajuanRowActions({
  obligation,
  accounts,
}: {
  obligation: Obligation;
  accounts: Account[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState<DialogKind>(null);
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

  function confirmDelete() {
    setError(null);
    start(async () => {
      const result = await deleteObligationAction(idString(obligation._id));
      if ("error" in result) {
        setError(result.error);
        return;
      }
      success();
    });
  }

  const isPending = obligation.status === "pending";

  return (
    <div className="flex shrink-0 items-center gap-0.5">
      {isPending && (
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-success hover:bg-success/10 hover:text-success"
          onClick={() => setOpen("lunas")}
          aria-label="Tandai lunas"
          title="Tandai lunas"
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
            <DialogTitle>Edit Pengajuan</DialogTitle>
          </DialogHeader>
          <PengajuanForm obligation={obligation} onSuccess={success} onCancel={close} />
        </DialogContent>
      </Dialog>

      <Dialog open={open === "lunas"} onOpenChange={(o) => !o && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tandai Pengajuan Lunas</DialogTitle>
            <DialogDescription>
              Sistem akan mencatat transaksi keluar dan menandai pengajuan sebagai lunas.
            </DialogDescription>
          </DialogHeader>
          <MarkLunasForm
            obligation={obligation}
            accounts={accounts}
            onSuccess={success}
            onCancel={close}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={open === "delete"}
        onOpenChange={(o) => !o && close()}
        title="Hapus pengajuan?"
        description={
          <>
            <span className="font-semibold">{obligation.item}</span> akan dihapus permanen.
            Tidak bisa dibatalkan.
          </>
        }
        confirmLabel="Hapus"
        onConfirm={confirmDelete}
        pending={pending}
        error={error}
      />
    </div>
  );
}

export function PengajuanCreateButton({ }: Record<string, never>) {
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
        + Tambah Pengajuan
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Pengajuan</DialogTitle>
          <DialogDescription>
            Catat permintaan dana baru yang belum dibayar.
          </DialogDescription>
        </DialogHeader>
        <PengajuanForm onSuccess={success} onCancel={close} />
      </DialogContent>
    </Dialog>
  );
}
