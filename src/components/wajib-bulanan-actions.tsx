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

export function WajibBulananCreateButton() {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [details, setDetails] = useState<DetailItem[]>([]);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const item = formData.get("item") as string;
    const amount = parseInt(formData.get("amount") as string) || 0;
    const category = formData.get("category") as string;
    const dueDay = parseInt(formData.get("due_day") as string) || undefined;
    const reminderDays = parseInt(formData.get("reminder_days") as string) || undefined;
    const month = formData.get("month") as string;

    try {
      await createObligationAction({
        type: "recurring",
        item,
        amount,
        category: category || "umum",
        org: "yrbb",
        owner: "yayasan",
        status: "active",
        due_day: dueDay,
        reminder_days: reminderDays,
        month: month || undefined,
        detail: details.length > 0 ? details : undefined,
      });
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
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [details, setDetails] = useState<DetailItem[]>(item.detail || []);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const itemName = formData.get("item") as string;
    const amount = parseInt(formData.get("amount") as string) || 0;
    const category = formData.get("category") as string;
    const dueDay = parseInt(formData.get("due_day") as string) || undefined;
    const reminderDays = parseInt(formData.get("reminder_days") as string) || undefined;
    const month = formData.get("month") as string;

    try {
      await updateObligationAction(item._id, {
        item: itemName,
        amount,
        category: category || "umum",
        due_day: dueDay,
        reminder_days: reminderDays,
        month: month || undefined,
        detail: details.length > 0 ? details : undefined,
      });
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
            <Label htmlFor={`item-${item._id}`}>Nama Item</Label>
            <Input 
              id={`item-${item._id}`} 
              name="item" 
              defaultValue={item.item}
              required 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor={`amount-${item._id}`}>Nominal Total (Rp)</Label>
            <Input 
              id={`amount-${item._id}`} 
              name="amount" 
              type="number" 
              defaultValue={item.amount || 0}
              required 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor={`category-${item._id}`}>Kelompok/Kategori</Label>
            <Input 
              id={`category-${item._id}`} 
              name="category" 
              defaultValue={item.category || ""}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`due_day-${item._id}`}>Tanggal Jatuh Tempo</Label>
              <Input 
                id={`due_day-${item._id}`} 
                name="due_day" 
                type="number" 
                min={1} 
                max={31} 
                defaultValue={item.due_day || ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`reminder_days-${item._id}`}>Reminder (H-)</Label>
              <Input 
                id={`reminder_days-${item._id}`} 
                name="reminder_days" 
                type="number" 
                min={0}
                defaultValue={item.reminder_days || ""}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor={`month-${item._id}`}>Bulan (Opsional)</Label>
            <Input 
              id={`month-${item._id}`} 
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
  const router = useRouter();

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteObligationAction(item._id);
      setOpen(false);
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
