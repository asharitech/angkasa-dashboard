"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DashboardIconFrame,
  DashboardInteractivePanel,
} from "@/components/layout/dashboard-surface";
import { formatRupiah, formatDateTime } from "@/lib/format";
import type { EmailNotif } from "@/lib/dal";
import { idString, cn } from "@/lib/utils";
import {
  EMAIL_NOTIF_CLASSIFICATIONS,
  emailNotifStatusBadgeVariant,
  sourceLabel,
  sourceBorderClass,
  sourceTintClass,
  stripHtmlToPlain,
  sanitizeBeneficiaryDisplay,
  isLikelyShallowDescription,
} from "./email-notif-helpers";
import {
  ArrowRightLeft,
  MoreHorizontal,
  EyeOff,
  Trash2,
  Building2,
  CreditCard,
  ShoppingBag,
  Wallet,
  Sparkles,
  Landmark,
  AlertTriangle,
} from "lucide-react";

function SourceIcon({ source }: { source: string }) {
  const k = (source || "").toLowerCase();
  if (k === "bca")
    return (
      <DashboardIconFrame>
        <Building2 className="h-5 w-5 text-sky-600 dark:text-sky-400" aria-hidden />
      </DashboardIconFrame>
    );
  if (k === "bri")
    return (
      <DashboardIconFrame>
        <Wallet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden />
      </DashboardIconFrame>
    );
  if (k === "btn")
    return (
      <DashboardIconFrame>
        <Landmark className="h-5 w-5 text-amber-700 dark:text-amber-500" aria-hidden />
      </DashboardIconFrame>
    );
  if (k === "mega")
    return (
      <DashboardIconFrame>
        <CreditCard className="h-5 w-5 text-violet-600 dark:text-violet-400" aria-hidden />
      </DashboardIconFrame>
    );
  if (k === "shopee" || k === "tokopedia")
    return (
      <DashboardIconFrame>
        <ShoppingBag className="h-5 w-5 text-orange-600 dark:text-orange-400" aria-hidden />
      </DashboardIconFrame>
    );
  return (
    <DashboardIconFrame>
      <Sparkles className="h-5 w-5 text-primary" aria-hidden />
    </DashboardIconFrame>
  );
}

export function EmailNotifRow({
  n,
  busy,
  canPost,
  noAccountsHint,
  onClassify,
  onOpenApprove,
  onIgnore,
  onRequestDelete,
}: {
  n: EmailNotif;
  busy: boolean;
  canPost: boolean;
  noAccountsHint: string | undefined;
  onClassify: (id: string, classification: string) => void;
  onOpenApprove: (n: EmailNotif) => void;
  onIgnore: (id: string) => void;
  onRequestDelete: (n: EmailNotif) => void;
}) {
  const nid = idString(n._id);
  const beneficiaryDisplay = sanitizeBeneficiaryDisplay(n.beneficiary_name);
  const rawPlain = n.raw_body ? stripHtmlToPlain(n.raw_body) : "";
  const shallow = isLikelyShallowDescription({
    description: n.description,
    email_subject: n.email_subject,
    source: n.source,
    beneficiary_name: n.beneficiary_name,
  });

  return (
    <DashboardInteractivePanel className={cn("border-l-4 pl-0", sourceBorderClass(n.source))}>
      <div
        className={cn(
          "flex flex-col gap-4 p-4 md:flex-row md:items-stretch md:gap-5 md:p-5",
          sourceTintClass(n.source),
        )}
        aria-busy={busy}
      >
        <SourceIcon source={n.source} />

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={emailNotifStatusBadgeVariant(n.status)} className="uppercase">
              {n.status}
            </Badge>
            <Badge variant="secondary" className="font-medium">
              {sourceLabel(n.source)}
            </Badge>
            {n.transfer_method ? (
              <Badge variant="outline" className="text-[11px] font-normal">
                {n.transfer_method}
              </Badge>
            ) : null}
            {n.classification ? (
              <Badge variant="info" className="max-w-[220px] truncate text-[11px]" title={n.classification}>
                {EMAIL_NOTIF_CLASSIFICATIONS.find((c) => c.value === n.classification)?.label ?? n.classification}
              </Badge>
            ) : null}
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Nominal</p>
            <p className="text-2xl font-bold tabular-nums tracking-tight text-foreground md:text-3xl">
              {formatRupiah(n.amount)}
              {n.fee ? (
                <span className="ml-2 text-sm font-normal text-muted-foreground">+ fee {formatRupiah(n.fee)}</span>
              ) : null}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-semibold leading-snug text-foreground md:text-base">{n.description}</p>
            {n.email_subject && n.email_subject !== n.description ? (
              <p className="line-clamp-2 text-xs text-muted-foreground">{n.email_subject}</p>
            ) : null}
          </div>

          {shallow ? (
            <p className="flex gap-2 rounded-lg border border-warning/35 bg-warning/10 px-3 py-2 text-xs leading-snug text-warning-foreground">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>
                Ringkasan tampak hanya dari subjek atau template. Gunakan cuplikan email di bawah (jika ada) atau edit
                saat mencatat — cron AI diinstruksikan untuk membaca <strong>badan email penuh</strong> pada jalan
                berikutnya.
              </span>
            </p>
          ) : null}

          {rawPlain.length > 40 ? (
            <details className="rounded-lg border border-border/70 bg-muted/20 text-xs">
              <summary className="cursor-pointer list-none px-3 py-2 font-medium text-muted-foreground marker:content-none [&::-webkit-details-marker]:hidden hover:text-foreground">
                Cuplikan isi email
              </summary>
              <div className="max-h-52 overflow-y-auto border-t border-border/50 px-3 py-2">
                <p className="whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-muted-foreground">
                  {rawPlain.length > 4500 ? `${rawPlain.slice(0, 4500)}…` : rawPlain}
                </p>
              </div>
            </details>
          ) : null}

          <dl className="grid grid-cols-1 gap-x-6 gap-y-1 text-xs text-muted-foreground sm:grid-cols-2">
            <div className="flex gap-2">
              <dt className="shrink-0 font-medium text-foreground/80">Waktu</dt>
              <dd>{formatDateTime(n.parsed_date)}</dd>
            </div>
            {beneficiaryDisplay ? (
              <div className="flex min-w-0 gap-2">
                <dt className="shrink-0 font-medium text-foreground/80">Penerima</dt>
                <dd className="truncate" title={beneficiaryDisplay}>
                  {beneficiaryDisplay}
                </dd>
              </div>
            ) : null}
            {n.beneficiary_bank ? (
              <div className="flex min-w-0 gap-2">
                <dt className="shrink-0 font-medium text-foreground/80">Bank</dt>
                <dd className="truncate">{n.beneficiary_bank}</dd>
              </div>
            ) : null}
            {n.reference_no ? (
              <div className="flex min-w-0 gap-2 sm:col-span-2">
                <dt className="shrink-0 font-medium text-foreground/80">Ref</dt>
                <dd className="truncate font-mono text-[11px]">{n.reference_no}</dd>
              </div>
            ) : null}
          </dl>
        </div>

        <div className="flex shrink-0 flex-col gap-2 border-t border-border/60 pt-4 md:w-[240px] md:border-l md:border-t-0 md:pl-5 md:pt-0">
          <Select
            value={n.classification ?? undefined}
            onValueChange={(v) => onClassify(nid, v ?? "")}
            disabled={busy}
          >
            <SelectTrigger className="h-10 w-full rounded-xl text-left text-sm" aria-label="Klasifikasi">
              <SelectValue placeholder="Klasifikasi…" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {EMAIL_NOTIF_CLASSIFICATIONS.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            type="button"
            className="h-10 w-full gap-2 rounded-xl font-semibold shadow-sm"
            disabled={busy || !canPost}
            title={noAccountsHint}
            onClick={() => onOpenApprove(n)}
          >
            <ArrowRightLeft className="h-4 w-4" aria-hidden />
            Catat ke buku
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              disabled={busy}
              className={cn(buttonVariants({ variant: "outline", size: "default" }), "h-10 w-full rounded-xl")}
            >
              <MoreHorizontal className="h-4 w-4" aria-hidden />
              Lainnya
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onIgnore(nid)} className="gap-2">
                <EyeOff className="h-4 w-4" />
                Tandai diabaikan
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onRequestDelete(n)}
                className="gap-2 text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Hapus dari antrean…
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </DashboardInteractivePanel>
  );
}
