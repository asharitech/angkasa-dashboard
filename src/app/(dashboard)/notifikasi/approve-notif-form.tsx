"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DashboardSurface } from "@/components/layout/dashboard-surface";
import { formatRupiah, formatDateTime } from "@/lib/format";
import type { EmailNotif } from "@/lib/dal";
import type { Account } from "@/lib/types";
import { cn } from "@/lib/utils";
import { DOMAINS } from "@/lib/config";
import {
  ENTRY_CATEGORIES_FOR_EMAIL,
  classificationToDefaultDomain,
  notifDefaultEntryType,
} from "./email-notif-helpers";
import { Building2, Wallet, ArrowDownLeft, ArrowUpRight } from "lucide-react";

export type ApproveNotifPayload = {
  account_id: string;
  category: string;
  description: string;
  domain: "yayasan" | "personal";
  type: "debit" | "credit";
};

export function ApproveNotifForm({
  notif,
  accounts,
  onSubmit,
  onCancel,
  disabled,
}: {
  notif: EmailNotif;
  accounts: Account[];
  onSubmit: (data: ApproveNotifPayload) => void;
  onCancel: () => void;
  disabled?: boolean;
}) {
  const [domain, setDomain] = useState<"yayasan" | "personal">(() =>
    classificationToDefaultDomain(notif.classification),
  );
  const [entryType, setEntryType] = useState<"debit" | "credit">(() => notifDefaultEntryType(notif.type));
  const [accountId, setAccountId] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState(notif.description);

  const accountsForDomain = useMemo(() => {
    if (domain === "yayasan") return accounts.filter((a) => a.type === "yayasan");
    return accounts.filter((a) => a.type !== "yayasan");
  }, [accounts, domain]);

  useEffect(() => {
    setAccountId((cur) => (accountsForDomain.some((a) => a._id === cur) ? cur : ""));
  }, [accountsForDomain]);

  const summary = (
    <DashboardSurface className="border-border/60 bg-muted/25 px-4 py-3 text-sm shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xl font-bold tabular-nums text-foreground">{formatRupiah(notif.amount)}</p>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            entryType === "debit"
              ? "bg-destructive/15 text-destructive"
              : "bg-success/15 text-success",
          )}
        >
          {entryType === "debit" ? "Keluar dari akun" : "Masuk ke akun"}
        </span>
      </div>
      <p className="mt-1 text-muted-foreground">{notif.description}</p>
      <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(notif.parsed_date)}</p>
    </DashboardSurface>
  );

  if (accounts.length === 0) {
    return (
      <div className="space-y-5">
        {summary}
        <DashboardSurface className="flex gap-3 border-border/80 px-4 py-4 text-sm text-muted-foreground shadow-sm">
          <Wallet className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
          <p>
            Belum ada akun terdaftar. Tambahkan rekening di data yayasan atau pribadi terlebih dahulu agar entri bisa
            diposting ke saldo yang benar.
          </p>
        </DashboardSurface>
        <Button type="button" variant="outline" className="w-full rounded-xl sm:w-auto" onClick={onCancel}>
          Tutup
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {summary}

      <fieldset className="space-y-2" disabled={disabled}>
        <legend className="mb-1.5 text-sm font-medium text-foreground">Domain buku besar</legend>
        <p className="text-xs text-muted-foreground">
          Item operasional yayasan yang ditalangi pribadi tetap pakai domain yayasan (sesuai kebijakan akuntansi).
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setDomain(DOMAINS.personal)}
            className={cn(
              "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-colors",
              domain === "personal"
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-muted/50",
            )}
          >
            <Wallet className="h-4 w-4 shrink-0" aria-hidden />
            Pribadi
          </button>
          <button
            type="button"
            onClick={() => setDomain(DOMAINS.yayasan)}
            className={cn(
              "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-colors",
              domain === "yayasan"
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-muted/50",
            )}
          >
            <Building2 className="h-4 w-4 shrink-0" aria-hidden />
            Yayasan
          </button>
        </div>
      </fieldset>

      <div className="space-y-2">
        <Label id="approve-flow-label" className="text-sm font-medium">
          Arah transaksi
        </Label>
        <div
          role="group"
          aria-labelledby="approve-flow-label"
          className="grid grid-cols-2 gap-2"
        >
          <button
            type="button"
            disabled={disabled}
            onClick={() => setEntryType("debit")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
              entryType === "debit"
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-muted/50",
            )}
          >
            <ArrowUpRight className="h-4 w-4" aria-hidden />
            Keluar (debit)
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setEntryType("credit")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
              entryType === "credit"
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-muted/50",
            )}
          >
            <ArrowDownLeft className="h-4 w-4" aria-hidden />
            Masuk (kredit)
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="approve-account">Akun</Label>
        <Select value={accountId || undefined} onValueChange={(v) => setAccountId(v ?? "")} disabled={disabled}>
          <SelectTrigger id="approve-account" className="h-10 rounded-xl">
            <SelectValue placeholder={accountsForDomain.length ? "Pilih akun…" : "Tidak ada akun untuk domain ini"} />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            {accountsForDomain.map((a) => (
              <SelectItem key={a._id} value={a._id}>
                {a.holder} ({a.bank}) — {formatRupiah(a.balance)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {accountsForDomain.length === 0 ? (
          <p className="text-xs text-destructive">Tambahkan akun {domain === "yayasan" ? "yayasan" : "pribadi"} di pengaturan data.</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="approve-category">Kategori</Label>
        <Select value={category || undefined} onValueChange={(v) => setCategory(v ?? "")} disabled={disabled}>
          <SelectTrigger id="approve-category" className="h-10 rounded-xl">
            <SelectValue placeholder="Pilih kategori…" />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            {ENTRY_CATEGORIES_FOR_EMAIL.map((c) => (
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
          rows={3}
          disabled={disabled}
          className="min-h-[88px] resize-y rounded-xl"
        />
      </div>

      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" className="rounded-xl sm:min-w-[100px]" onClick={onCancel} disabled={disabled}>
          Batal
        </Button>
        <Button
          type="button"
          className="rounded-xl font-semibold sm:min-w-[160px]"
          disabled={disabled || !accountId || !category || accountsForDomain.length === 0}
          onClick={() =>
            onSubmit({
              account_id: accountId,
              category,
              description,
              domain,
              type: entryType,
            })
          }
        >
          Simpan & catat
        </Button>
      </div>
    </div>
  );
}
