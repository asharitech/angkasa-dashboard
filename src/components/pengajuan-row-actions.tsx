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
import { Pencil, Trash2, CheckCircle2, Loader2, AlertTriangle, Plus } from "lucide-react";
import { PengajuanForm } from "./pengajuan-form";
import { MarkLunasForm } from "./mark-lunas-form";
import { deleteObligationAction } from "@/lib/actions/obligations";
import type { Obligation, Account } from "@/lib/types";

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
      const result = await deleteObligationAction(obligation._id);
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
          className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
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
        className="text-destructive hover:bg-rose-50 hover:text-destructive"
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
              <DialogTitle>Hapus pengajuan?</DialogTitle>
            </div>
            <DialogDescription>
              <span className="font-semibold">{obligation.item}</span> akan dihapus permanen.
              Tidak bisa dibatalkan.
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
      <button className="btn btn--primary" onClick={() => setOpen(true)}>
        <Plus className="btn__icon" /> Buat Pengajuan
      </button>
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

export function PengajuanDetailActions({
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
      const result = await deleteObligationAction(obligation._id);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      success();
    });
  }

  return (
    <>
      <div className="detail__actions">
        <button className="btn btn--secondary" onClick={() => setOpen("delete")}>Hapus</button>
        <button className="btn btn--secondary" onClick={() => setOpen("edit")}>Edit</button>
        {obligation.status === "pending" && (
          <button className="btn btn--primary" style={{ background: "var(--pos-700)" }} onClick={() => setOpen("lunas")}>Setujui & transfer</button>
        )}
      </div>

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

      <Dialog open={open === "delete"} onOpenChange={(o) => { if (!o && !pending) close(); }}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <DialogTitle>Hapus pengajuan?</DialogTitle>
            </div>
            <DialogDescription>
              <span className="font-semibold">{obligation.item}</span> akan dihapus permanen.
              Tidak bisa dibatalkan.
            </DialogDescription>
          </DialogHeader>
          {error && <p className="rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={close} disabled={pending}>Batal</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={pending}>
              {pending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
