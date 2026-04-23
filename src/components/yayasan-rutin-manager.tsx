"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { createObligationAction, updateObligationAction, deleteObligationAction } from "@/lib/actions/obligations";
import { formatDate, formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Pencil, Trash2, Plus, Loader2, CalendarDays, BellRing, CheckCircle2 } from "lucide-react";
import type { Obligation } from "@/lib/types";
import type { YayasanRoutineGroup } from "@/lib/yayasan-rutin";

type GroupDoc = Obligation & { groupKey: string; dueDay: number; reminderDay: number; notes?: string; total: number };

function toTextDetail(group: YayasanRoutineGroup) {
  return group.items
    .map((item) => `${item.name}|${item.amount}|${item.note ?? ""}|${item.done ? "1" : "0"}`)
    .join("\n");
}

function fromTextDetail(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name = "", amount = "0", note = "", done = "0"] = line.split("|");
      return {
        name: name.trim(),
        amount: Number(amount) || 0,
        note: note.trim() || undefined,
        done: done === "1",
      };
    })
    .filter((item) => item.name);
}

function normalizeGroup(obligation: Obligation): GroupDoc {
  const groupKey = obligation.tags?.find((tag) => tag.startsWith("routine_group:"))?.replace("routine_group:", "") ?? obligation._id;
  const reminderTag = obligation.tags?.find((tag) => tag.startsWith("reminder_day:"));
  const reminderDay = reminderTag ? Number(reminderTag.replace("reminder_day:", "")) : Math.max(1, Number(obligation.due_day ?? 1) - 2);
  const items = (obligation.detail ?? []).map((item) => ({ item: item.item, amount: item.amount }));
  const total = items.reduce((sum, item) => sum + (item.amount ?? 0), 0);
  return {
    ...obligation,
    groupKey,
    dueDay: Number(obligation.due_day ?? 1),
    reminderDay,
    notes: obligation.bukti_ref ?? undefined,
    total,
  };
}

function GroupForm({
  obligation,
  seed,
  onSuccess,
  onCancel,
}: {
  obligation?: GroupDoc | null;
  seed?: YayasanRoutineGroup | null;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const isEdit = !!obligation;
  const router = useRouter();
  const [pending, start] = useTransition();
  const [title, setTitle] = useState(obligation?.item ?? seed?.title ?? "");
  const [groupKey, setGroupKey] = useState(obligation?.groupKey ?? seed?.key ?? "");
  const [dueDay, setDueDay] = useState(String(obligation?.dueDay ?? seed?.due_day ?? 1));
  const [reminderDay, setReminderDay] = useState(String(obligation?.reminderDay ?? seed?.reminder_day ?? 1));
  const [notes, setNotes] = useState(obligation?.notes ?? seed?.notes ?? "");
  const [detailText, setDetailText] = useState(
    obligation
      ? (obligation.detail ?? []).map((item) => `${item.item}|${item.amount}|`).join("\n")
      : seed
        ? toTextDetail(seed)
        : "",
  );
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const items = fromTextDetail(detailText);
    const amount = items.reduce((sum, item) => sum + item.amount, 0);
    if (!title.trim()) return setError("Judul kelompok wajib diisi");
    if (!groupKey.trim()) return setError("Kode kelompok wajib diisi");
    if (!items.length) return setError("Isi detail item minimal 1 baris");

    start(async () => {
      const payload = {
        type: "recurring" as const,
        item: title.trim(),
        amount,
        category: "wajib_bulanan_yayasan",
        month: null,
        owner: "yayasan",
        org: "yrbb",
        due_day: Number(dueDay) || 1,
        frequency: "monthly",
        is_active: true,
        bukti_ref: notes.trim() || null,
        detail: items.map((item) => ({ item: item.name, amount: item.amount })),
        tags: [`routine_group:${groupKey.trim().toLowerCase()}`, `reminder_day:${Number(reminderDay) || 1}`],
      };

      const result = isEdit
        ? await updateObligationAction(obligation!._id, payload)
        : await createObligationAction(payload);

      if ("error" in result) {
        setError(result.error);
        return;
      }
      router.refresh();
      onSuccess();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Nama Kelompok</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contoh: Gaji" />
        </div>
        <div className="space-y-1.5">
          <Label>Kode Kelompok</Label>
          <Input value={groupKey} onChange={(e) => setGroupKey(e.target.value)} placeholder="Contoh: gaji" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Jatuh Tempo</Label>
          <Input type="number" min="1" max="31" value={dueDay} onChange={(e) => setDueDay(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Reminder</Label>
          <Input type="number" min="1" max="31" value={reminderDay} onChange={(e) => setReminderDay(e.target.value)} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Catatan Kelompok</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Catatan tambahan, dasar perhitungan, atau scope kelompok" />
      </div>

      <div className="space-y-1.5">
        <Label>Detail Item</Label>
        <Textarea
          value={detailText}
          onChange={(e) => setDetailText(e.target.value)}
          rows={10}
          placeholder={"Format per baris: nama|nominal|catatan\nContoh: Angkasa|10000000|SMBORO, SMR, TPL"}
        />
        <p className="text-xs text-muted-foreground">Satu baris satu item, format: nama|nominal|catatan</p>
      </div>

      {error && <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>Batal</Button>
        <Button type="submit" className="flex-1" disabled={pending}>
          {pending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
          {isEdit ? "Simpan Perubahan" : "Tambah Kelompok"}
        </Button>
      </div>
    </form>
  );
}

export function YayasanRutinManager({
  obligations,
  seeds,
}: {
  obligations: Obligation[];
  seeds: YayasanRoutineGroup[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<GroupDoc | null>(null);
  const [creating, setCreating] = useState(false);
  const [seed, setSeed] = useState<YayasanRoutineGroup | null>(null);
  const [deleting, setDeleting] = useState<GroupDoc | null>(null);
  const [pendingDelete, startDelete] = useTransition();

  const groups = useMemo(() => {
    if (obligations.length > 0) return obligations.map(normalizeGroup);
    return [];
  }, [obligations]);

  const totalAmount = groups.reduce((sum, group) => sum + group.total, 0);

  function closeDialogs() {
    setEditing(null);
    setCreating(false);
    setDeleting(null);
    setSeed(null);
  }

  function removeGroup() {
    if (!deleting) return;
    startDelete(async () => {
      const res = await deleteObligationAction(deleting._id);
      if ("error" in res) return;
      router.refresh();
      closeDialogs();
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Pengelolaan Wajib Bulanan Yayasan</h2>
          <p className="text-sm text-muted-foreground">Kelola kelompok, detail item, jatuh tempo, dan reminder dalam satu halaman yang lebih rapi.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="px-3 py-1 text-sm">{groups.length} kelompok</Badge>
          <Badge variant="secondary" className="px-3 py-1 text-sm">{formatRupiah(totalAmount)}/bulan</Badge>
          <Button onClick={() => { setSeed(null); setCreating(true); }}>
            <Plus className="mr-1.5 h-4 w-4" /> Tambah Kelompok
          </Button>
        </div>
      </div>

      {groups.length === 0 && seeds.length > 0 && (
        <div className="rounded-2xl border border-dashed bg-background/60 p-4">
          <p className="text-sm font-medium">Template awal siap dipakai</p>
          <p className="mt-1 text-sm text-muted-foreground">Silakan pilih kelompok template di bawah untuk dijadikan data aktif yang bisa diedit.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {seeds.map((group) => (
              <Button key={group.key} variant="outline" onClick={() => { setSeed(group); setCreating(true); }}>
                <Plus className="mr-1.5 h-4 w-4" /> {group.title}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {groups.map((group) => (
          <section key={group._id} className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="flex flex-col gap-3 border-b bg-muted/30 px-4 py-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold tracking-tight">{group.item}</h3>
                  <Badge variant="secondary">{group.detail?.length ?? 0} item</Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1"><CalendarDays className="h-3.5 w-3.5" /> Jatuh tempo {formatDate(`2026-04-${String(group.dueDay).padStart(2, "0")}`)}</span>
                  <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1"><BellRing className="h-3.5 w-3.5" /> Reminder {formatDate(`2026-04-${String(group.reminderDay).padStart(2, "0")}`)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-lg font-bold tabular-nums">{formatRupiah(group.total)}</p>
                </div>
                <Button variant="outline" size="icon-sm" onClick={() => setEditing(group)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="destructive" size="icon-sm" onClick={() => setDeleting(group)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>

            <div className="divide-y divide-border/60 px-4">
              {(group.detail ?? []).map((item, idx) => (
                <div key={`${group._id}-${idx}`} className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-muted-foreground w-4">{idx + 1}.</span>
                      <p className="text-sm font-medium">{item.item}</p>
                    </div>
                    {group.item === "Gaji" && <p className="mt-1 ml-7 text-[11px] text-muted-foreground">Sudah dibayar</p>}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold tabular-nums">{formatRupiah(item.amount)}</p>
                    <p className={cn("text-xs font-medium", group.item === "Gaji" ? "text-emerald-600" : "text-amber-600")}>{group.item === "Gaji" ? "Sudah" : "Belum"}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <Dialog open={creating} onOpenChange={(o) => !o && closeDialogs()}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tambah Kelompok Wajib Bulanan</DialogTitle>
            <DialogDescription>Buat kelompok baru yang bisa diedit dan dipahami dengan rapi.</DialogDescription>
          </DialogHeader>
          <GroupForm seed={seed} onSuccess={closeDialogs} onCancel={closeDialogs} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && closeDialogs()}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Kelompok Wajib Bulanan</DialogTitle>
            <DialogDescription>Perbarui nama kelompok, item, jatuh tempo, dan reminder.</DialogDescription>
          </DialogHeader>
          {editing && <GroupForm obligation={editing} onSuccess={closeDialogs} onCancel={closeDialogs} />}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleting} onOpenChange={(o) => !o && closeDialogs()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Kelompok?</DialogTitle>
            <DialogDescription>Kelompok ini akan dihapus dari wajib bulanan yayasan.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button variant="outline" onClick={closeDialogs} disabled={pendingDelete}>Batal</Button>
            <Button variant="destructive" onClick={removeGroup} disabled={pendingDelete}>
              {pendingDelete && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Hapus
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
