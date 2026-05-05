"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { BadgeVariant } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/empty-state";
import { updateEmailNotifAction, approveEmailNotifAction, deleteEmailNotifAction } from "@/lib/actions/email-notifs";
import { formatRupiah, formatDateTime } from "@/lib/format";
import type { EmailNotif } from "@/lib/data";
import type { Account } from "@/lib/types";
import { Inbox, Clock, CheckCircle2, XCircle, Mail } from "lucide-react";

const CLASSIFICATIONS = [
  { value: "yayasan_puang", label: "Yayasan — Puang Imran" },
  { value: "yayasan_staff", label: "Yayasan — Staff" },
  { value: "pribadi_angkasa", label: "Pribadi — Angkasa" },
  { value: "pribadi_eba", label: "Pribadi — Eba" },
  { value: "piutang", label: "Piutang" },
  { value: "numpang", label: "Numpang" },
  { value: "tabungan", label: "Tabungan" },
  { value: "cicilan", label: "Cicilan" },
  { value: "transit", label: "Transit" },
  { value: "lainnya", label: "Lainnya" },
];

function statusBadgeVariant(status: string): BadgeVariant {
  switch (status) {
    case "pending":
      return "warning";
    case "approved":
      return "success";
    case "rejected":
      return "destructive";
    case "ignored":
      return "secondary";
    default:
      return "outline";
  }
}

const SOURCE_LABELS: Record<string, string> = {
  bri: "BRI",
  bca: "BCA",
  mega: "Mega",
  shopee: "Shopee",
  other: "Lainnya",
};

export function NotifikasiClient({
  notifs,
  stats,
  accounts,
}: {
  notifs: EmailNotif[];
  stats: { total: number; pending: number; approved: number; rejected: number };
  accounts: Account[];
}) {
  const [items, setItems] = useState<EmailNotif[]>(notifs);
  const [selected, setSelected] = useState<EmailNotif | null>(null);
  const [classifyOpen, setClassifyOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleClassify = async (id: string, classification: string) => {
    setLoading(true);
    await updateEmailNotifAction(id, { classification });
    setItems((prev) =>
      prev.map((n) => (n._id === id ? { ...n, classification } : n))
    );
    setLoading(false);
  };

  const handleApprove = async (id: string, data: { account_id: string; category: string; description: string }) => {
    setLoading(true);
    await approveEmailNotifAction(id, data);
    setItems((prev) => prev.filter((n) => n._id !== id));
    setApproveOpen(false);
    setSelected(null);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus notifikasi ini?")) return;
    setLoading(true);
    await deleteEmailNotifAction(id);
    setItems((prev) => prev.filter((n) => n._id !== id));
    setLoading(false);
  };

  const handleIgnore = async (id: string) => {
    setLoading(true);
    await updateEmailNotifAction(id, { status: "ignored" });
    setItems((prev) => prev.filter((n) => n._id !== id));
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Total
            </CardTitle>
            <Inbox className="h-4 w-4 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums tracking-tight">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-sm ring-1 ring-warning/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-warning">
              Pending
            </CardTitle>
            <Clock className="h-4 w-4 text-warning" aria-hidden />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums tracking-tight text-warning">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-success">
              Approved
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums tracking-tight text-success">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-destructive">
              Rejected
            </CardTitle>
            <XCircle className="h-4 w-4 text-destructive" aria-hidden />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums tracking-tight text-destructive">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      <div className="space-y-3">
        {items.length === 0 && (
          <EmptyState
            icon={Mail}
            title="Antrian kosong"
            description="Tidak ada notifikasi dengan status pending. Yang sudah dicatat, diabaikan, atau ditolak tetap tercatat di statistik di atas."
            tone="muted"
          />
        )}

        {items.map((n) => (
          <Card key={n._id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                {/* Left: info */}
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={statusBadgeVariant(n.status)}>{n.status}</Badge>
                    <Badge variant="secondary">{SOURCE_LABELS[n.source] || n.source}</Badge>
                    {n.transfer_method && (
                      <Badge variant="outline" className="text-xs">
                        {n.transfer_method}
                      </Badge>
                    )}
                    {n.classification && (
                      <Badge variant="info" className="text-xs">
                        {CLASSIFICATIONS.find((c) => c.value === n.classification)?.label || n.classification}
                      </Badge>
                    )}
                  </div>

                  <p className="font-semibold text-lg truncate">{n.description}</p>

                  <div className="text-sm text-muted-foreground space-y-0.5">
                    <p>
                      {formatDateTime(n.parsed_date)} &middot; {formatRupiah(n.amount)}
                      {n.fee ? ` (+ fee ${formatRupiah(n.fee)})` : ""}
                    </p>
                    {n.beneficiary_name && <p>Ke: {n.beneficiary_name}</p>}
                    {n.beneficiary_bank && <p>Bank: {n.beneficiary_bank}</p>}
                    {n.reference_no && <p>Ref: {n.reference_no}</p>}
                  </div>
                </div>

                {/* Right: actions */}
                <div className="flex flex-wrap gap-2 items-start">
                  <Select
                    value={n.classification || ""}
                    onValueChange={(v) => handleClassify(String(n._id), v ?? "")}
                    disabled={loading}
                  >
                    <SelectTrigger className="w-[200px] text-xs">
                      <SelectValue placeholder="Klasifikasikan..." />
                    </SelectTrigger>
                    <SelectContent>
                      {CLASSIFICATIONS.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    size="sm"
                    variant="default"
                    disabled={loading}
                    onClick={() => {
                      setSelected(n);
                      setApproveOpen(true);
                    }}
                  >
                    Catat
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={loading}
                    onClick={() => handleIgnore(n._id)}
                  >
                    Abaikan
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:text-red-700"
                    disabled={loading}
                    onClick={() => handleDelete(n._id)}
                  >
                    Hapus
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Approve Dialog */}
      {selected && (
        <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Catat Transaksi</DialogTitle>
            </DialogHeader>
            <ApproveForm
              notif={selected}
              accounts={accounts}
              onSubmit={(data) => handleApprove(selected._id, data)}
              onCancel={() => {
                setApproveOpen(false);
                setSelected(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function ApproveForm({
  notif,
  accounts,
  onSubmit,
  onCancel,
}: {
  notif: EmailNotif;
  accounts: Account[];
  onSubmit: (data: { account_id: string; category: string; description: string }) => void;
  onCancel: () => void;
}) {
  const [accountId, setAccountId] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState(notif.description);

  const categories = [
    { value: "transfer", label: "Transfer" },
    { value: "makan", label: "Makan & Minum" },
    { value: "belanja", label: "Belanja" },
    { value: "top_up", label: "Top Up" },
    { value: "qris", label: "QRIS" },
    { value: "pln", label: "PLN / Listrik" },
    { value: "bpjs", label: "BPJS" },
    { value: "pulsa", label: "Pulsa / Data" },
    { value: "cicilan", label: "Cicilan" },
    { value: "savings", label: "Tabungan" },
    { value: "lainnya", label: "Lainnya" },
    { value: "sewa_masuk", label: "Sewa Masuk" },
    { value: "modal", label: "Modal" },
    { value: "insentif", label: "Insentif" },
    { value: "pengajuan", label: "Pengajuan" },
    { value: "loan", label: "Pinjaman" },
  ];

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        <p>
          <strong>{formatRupiah(notif.amount)}</strong> &middot; {notif.description}
        </p>
        <p>{formatDateTime(notif.parsed_date)}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="approve-account">Akun</Label>
        <Select value={accountId} onValueChange={(v) => setAccountId(v ?? "")}>
          <SelectTrigger id="approve-account">
            <SelectValue placeholder="Pilih akun..." />
          </SelectTrigger>
          <SelectContent>
            {accounts.map((a) => (
              <SelectItem key={a._id} value={a._id}>
                {a.holder} ({a.bank}) — {formatRupiah(a.balance)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="approve-category">Kategori</Label>
        <Select value={category} onValueChange={(v) => setCategory(v ?? "")}>
          <SelectTrigger id="approve-category">
            <SelectValue placeholder="Pilih kategori..." />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="approve-description">Deskripsi</Label>
        <Textarea
          id="approve-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button
          disabled={!accountId || !category}
          onClick={() => onSubmit({ account_id: accountId, category, description })}
        >
          Simpan & Catat
        </Button>
      </div>
    </div>
  );
}
