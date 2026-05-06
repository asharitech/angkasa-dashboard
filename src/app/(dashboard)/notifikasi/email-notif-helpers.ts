import type { BadgeVariant } from "@/components/ui/badge";

export const EMAIL_NOTIF_CLASSIFICATIONS = [
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
] as const;

export const ENTRY_CATEGORIES_FOR_EMAIL = [
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
] as const;

const SOURCE_LABELS: Record<string, string> = {
  bri: "BRI",
  bca: "BCA",
  btn: "BTN",
  mega: "Bank Mega",
  shopee: "Shopee",
  gojek: "Gojek",
  grab: "Grab",
  tokopedia: "Tokopedia",
  other: "Lainnya",
};

export function emailNotifStatusBadgeVariant(status: string): BadgeVariant {
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

export function sourceLabel(source: string): string {
  const k = (source || "").toLowerCase();
  return SOURCE_LABELS[k] || source || "Sumber";
}

export function sourceBorderClass(source: string): string {
  const k = (source || "").toLowerCase();
  if (k === "bca") return "border-l-sky-500";
  if (k === "bri") return "border-l-emerald-600";
  if (k === "btn") return "border-l-amber-600";
  if (k === "mega") return "border-l-violet-600";
  if (k === "shopee" || k === "tokopedia") return "border-l-orange-500";
  if (k === "gojek" || k === "grab") return "border-l-teal-600";
  return "border-l-primary";
}

export function sourceTintClass(source: string): string {
  const k = (source || "").toLowerCase();
  if (k === "bca") return "bg-sky-500/[0.06]";
  if (k === "bri") return "bg-emerald-600/[0.06]";
  if (k === "btn") return "bg-amber-600/[0.06]";
  if (k === "mega") return "bg-violet-600/[0.06]";
  if (k === "shopee" || k === "tokopedia") return "bg-orange-500/[0.06]";
  if (k === "gojek" || k === "grab") return "bg-teal-600/[0.06]";
  return "bg-primary/[0.06]";
}

export type EmailSourceFilter = "all" | "bca" | "bri" | "other";

export function matchesEmailSourceFilter(source: string, filter: EmailSourceFilter): boolean {
  if (filter === "all") return true;
  const k = (source || "").toLowerCase();
  if (filter === "bca") return k === "bca";
  if (filter === "bri") return k === "bri";
  return k !== "bca" && k !== "bri";
}

export type EmailNotifSort = "newest" | "oldest" | "amount_high" | "amount_low";

export function classificationToDefaultDomain(classification?: string): "yayasan" | "personal" {
  if (!classification) return "personal";
  if (classification === "yayasan_puang" || classification === "yayasan_staff") return "yayasan";
  return "personal";
}

export function notifDefaultEntryType(notifType: string): "debit" | "credit" {
  const t = (notifType || "").toLowerCase();
  if (t === "credit") return "credit";
  return "debit";
}

/** Strip tags and collapse whitespace for safe display of stored email excerpts. */
export function stripHtmlToPlain(htmlish: string): string {
  const s = htmlish.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return s;
}

/**
 * Remove common bank email footers accidentally merged into beneficiary/counterparty fields.
 */
export function sanitizeBeneficiaryDisplay(value: string | undefined): string | undefined {
  if (!value) return undefined;
  let v = value.trim();
  const cutRes = [
    /Note\s*\(s\)\s*:/i,
    /\bPlease save this email\b/i,
    /\bHalo BCA\b/i,
    /\bNPWP\s*:/i,
    /\bBest Regards\b/i,
    /\bThis email is generated\b/i,
    /PT BANK CENTRAL ASIA/i,
    /\bMENARA BCA\b/i,
    /\bFees Include VAT\b/i,
  ];
  for (const re of cutRes) {
    const m = re.exec(v);
    if (m?.index != null && m.index > 0) {
      v = v.slice(0, m.index).trim();
    }
  }
  v = v.replace(/\s+/g, " ").trim();
  if (v.length > 120) v = `${v.slice(0, 117)}…`;
  return v || undefined;
}

/**
 * True if description looks like subject-only / legacy template (kurang konteks dari badan email).
 */
export function isLikelyShallowDescription(n: {
  description: string;
  email_subject: string;
  source: string;
  beneficiary_name?: string;
}): boolean {
  const d = (n.description || "").trim();
  const sub = (n.email_subject || "").trim();
  if (!d) return true;
  if (d === sub) return true;
  const src = (n.source || "").toLowerCase();
  if (src === "bri" && /^BRI:\s/i.test(d) && !n.beneficiary_name && d.length <= sub.length + 10) {
    return true;
  }
  return false;
}
