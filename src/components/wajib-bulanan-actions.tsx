"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { createObligationAction, updateObligationAction, deleteObligationAction } from "@/lib/actions/obligations";
import { useRouter } from "next/navigation";
import type { Obligation, DetailItem } from "@/lib/types";
import { idString } from "@/lib/utils";
import { ORG_ID } from "@/lib/config";

export function WajibBulananCreateButton() {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [details, setDetails] = useState<DetailItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const item = formData.get("item") as string;
    const amount = parseInt(formData.get("amount") as string) || 0;
    const category = formData.get("category") as string;
    const dueDay = parseInt(formData.get("due_day") as string) || undefined;
    const reminderDays = parseInt(formData.get("reminder_days") as string) || undefined;
    const month = formData.get("month") as string;

    if (!item.trim()) return setError("Nama item wajib diisi");
    if (amount <= 0) return setError("Nominal harus lebih dari 0");

    const validDetails = details.filter((d) => d.item.trim());
    setSubmitting(true);
    try {
      const result = await createObligationAction({
        type: "recurring",
        item,
        amount,
        category: category || "umum",
        org: ORG_ID,
        owner: "yayasan",
        status: "active",
        due_day: dueDay,
        reminder_days: reminderDays,
        month: month || undefined,
        detail: validDetails.length > 0 ? validDetails : undefined,
      });
      if ("error" in result) { setError(result.error); return; }
      setOpen(false);
      setDetails([]);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  function addDetail() {
    setDetails([...details, { item: "", amount: 0 }]);
  }

  function removeDetail(index: number) {
    setDetails(details.filter((_, i) => i !== index));
  }

  function updateDetail(index: number, field: keyof DetailItem, value: string | number) {
    const newDetails = [...details];
    newDetails[index] = { ...newDetails[index], [field]: value };
    setDetails(newDetails);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          Tambah
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Wajib Bulanan</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="item">Nama Item</Label>
            <Input id="item" name="item" placeholder="Contoh: Gaji Staff" required />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amount">Nominal Total (Rp)</Label>
            <Input id="amount" name="amount" type="number" placeholder="1000000" required />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Kelompok/Kategori</Label>
            <Input id="category" name="category" placeholder="Contoh: gaji, operasional" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="due_day">Tanggal Jatuh Tempo</Label>
              <Input id="due_day" name="due_day" type="number" min={1} max={31} placeholder="1-31" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reminder_days">Reminder (H-)</Label>
              <Input id="reminder_days" name="reminder_days" type="number" min={0} placeholder="Hari" />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="month">Bulan (Opsional)</Label>
            <Input id="month" name="month" type="month" placeholder="YYYY-MM" />
            <p className="text-xs text-muted-foreground">Kosongkan untuk item yang berlaku setiap bulan</p>
          </div>

          {/* Detail Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Rincian Pembayaran (Opsional)</Label>
              <Button type="button" size="sm" variant="outline" onClick={addDetail}>
                <Plus className="h-3 w-3 mr-1" />
                Tambah
              </Button>
            </div>
            {details.map((detail, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  placeholder="Nama"
                  value={detail.item}
                  onChange={(e) => updateDetail(index, "item", e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Nominal"
                  type="number"
                  value={detail.amount || ""}
                  onChange={(e) => updateDetail(index, "amount", parseInt(e.target.value) || 0)}
                  className="w-28"
                />
                <Button type="button" size="sm" variant="ghost" onClick={() => removeDetail(index)}>
                  <X className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          )}
          <DialogFooter>
            <DialogClose>
              <Button type="button" variant="outline">Batal</Button>
            </DialogClose>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function WajibBulananEditButton({ item }: { item: Obligation }) {
  const itemId = idString(item._id);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [details, setDetails] = useState<DetailItem[]>(item.detail || []);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const itemName = formData.get("item") as string;
    const amount = parseInt(formData.get("amount") as string) || 0;
    const category = formData.get("category") as string;
    const dueDay = parseInt(formData.get("due_day") as string) || undefined;
    const reminderDays = parseInt(formData.get("reminder_days") as string) || undefined;
    const month = formData.get("month") as string;

    if (!itemName.trim()) return setError("Nama item wajib diisi");
    if (amount <= 0) return setError("Nominal harus lebih dari 0");

    const validDetails = details.filter((d) => d.item.trim());
    setSubmitting(true);
    try {
      const result = await updateObligationAction(itemId, {
        item: itemName,
        amount,
        category: category || "umum",
        due_day: dueDay,
        reminder_days: reminderDays,
        month: month || undefined,
        detail: validDetails.length > 0 ? validDetails : undefined,
      });
      if ("error" in result) { setError(result.error); return; }
      setOpen(false);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  function addDetail() {
    setDetails([...details, { item: "", amount: 0 }]);
  }

  function removeDetail(index: number) {
    setDetails(details.filter((_, i) => i !== index));
  }

  function updateDetail(index: number, field: keyof DetailItem, value: string | number) {
    const newDetails = [...details];
    newDetails[index] = { ...newDetails[index], [field]: value };
    setDetails(newDetails);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button size="sm" variant="outline" className="h-8 px-2">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Wajib Bulanan</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`item-${itemId}`}>Nama Item</Label>
            <Input 
              id={`item-${itemId}`} 
              name="item" 
              defaultValue={item.item}
              required 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor={`amount-${itemId}`}>Nominal Total (Rp)</Label>
            <Input 
              id={`amount-${itemId}`} 
              name="amount" 
              type="number" 
              defaultValue={item.amount || 0}
              required 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor={`category-${itemId}`}>Kelompok/Kategori</Label>
            <Input 
              id={`category-${itemId}`} 
              name="category" 
              defaultValue={item.category || ""}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`due_day-${itemId}`}>Tanggal Jatuh Tempo</Label>
              <Input 
                id={`due_day-${itemId}`} 
                name="due_day" 
                type="number" 
                min={1} 
                max={31} 
                defaultValue={item.due_day || ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`reminder_days-${itemId}`}>Reminder (H-)</Label>
              <Input 
                id={`reminder_days-${itemId}`} 
                name="reminder_days" 
                type="number" 
                min={0}
                defaultValue={item.reminder_days || ""}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor={`month-${itemId}`}>Bulan (Opsional)</Label>
            <Input 
              id={`month-${itemId}`} 
              name="month" 
              type="month"
              defaultValue={item.month || ""}
            />
            <p className="text-xs text-muted-foreground">Kosongkan untuk item yang berlaku setiap bulan</p>
          </div>

          {/* Detail Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Rincian Pembayaran</Label>
              <Button type="button" size="sm" variant="outline" onClick={addDetail}>
                <Plus className="h-3 w-3 mr-1" />
                Tambah Rincian
              </Button>
            </div>
            {details.length === 0 && (
              <p className="text-xs text-muted-foreground">Belum ada rincian. Klik &quot;Tambah Rincian&quot; untuk menambah.</p>
            )}
            {details.map((detail, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  placeholder="Nama penerima"
                  value={detail.item}
                  onChange={(e) => updateDetail(index, "item", e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Nominal"
                  type="number"
                  value={detail.amount || ""}
                  onChange={(e) => updateDetail(index, "amount", parseInt(e.target.value) || 0)}
                  className="w-28"
                />
                <Button type="button" size="sm" variant="ghost" onClick={() => removeDetail(index)}>
                  <X className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          )}
          <DialogFooter>
            <DialogClose>
              <Button type="button" variant="outline">Batal</Button>
            </DialogClose>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function WajibBulananDeleteButton({ item }: { item: Obligation }) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      const result = await deleteObligationAction(idString(item._id));
      if ("error" in result) { setError(result.error); return; }
      setOpen(false);
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setError(null); }}>
      <DialogTrigger>
        <Button size="sm" variant="outline" className="h-8 px-2 text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Hapus Wajib Bulanan</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Yakin ingin menghapus <strong>{item.item}</strong>?
          <br />
          Tindakan ini tidak dapat dibatalkan.
        </p>
        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}
        <DialogFooter>
          <DialogClose>
            <Button type="button" variant="outline">Batal</Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Menghapus..." : "Hapus"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
