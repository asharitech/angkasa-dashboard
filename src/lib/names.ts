/**
 * Human-readable display names for database identifiers.
 *
 * The maps here are OPTIONAL overrides — all functions have smart fallbacks
 * so new people/sources added to the DB automatically display reasonably
 * without requiring a code change.
 *
 * Fund source values are the source of truth in lib/config.ts.
 */

import { FUND_SOURCES, type FundSource } from "@/lib/config";

// Re-export for backward-compat (validate.ts imports this)
export const FUND_SOURCE_VALUES: string[] = [...FUND_SOURCES];

/** Pretty-print overrides for known requestor identifiers. */
const REQUESTOR_LABELS: Record<string, string> = {
  patta_wellang: "Patta Wellang",
  yayasan_btn: "Yayasan BTN",
  yayasan_bri: "Yayasan BRI",
  pak_sandi: "Pak Sandi",
  angkasa: "Angkasa",
  admin: "Administrator",
};

/** Pretty-print overrides for known fund source identifiers. */
const FUND_SOURCE_LABELS: Record<string, string> = {
  CASH_YAYASAN: "Cash Yayasan",
  CASH_FAHMI: "Cash Fahmi",
  CASH_PATWAR: "Cash Patwar",
  CASH_GAFFAR: "Cash Gaffar",
  BRI_ANGKASA: "BRI Angkasa",
  BTN_YAYASAN: "BTN Yayasan",
  SEABANK_NANA: "SeaBank Nana",
  DANA_SEWA: "Dana Sewa",
} satisfies Record<FundSource, string>;

/** Indonesian display labels for obligation/status values. */
const STATUS_LABELS_ID: Record<string, string> = {
  pending: "Menunggu",
  approved: "Disetujui",
  rejected: "Ditolak",
  lunas: "Lunas",
  active: "Aktif",
  running: "Berjalan",
  hold: "Ditahan",
  inactive: "Nonaktif",
  completed: "Selesai",
  cancelled: "Dibatalkan",
  expired: "Kadaluarsa",
};

/**
 * Converts any identifier (snake_case or SCREAMING_SNAKE) to Title Case.
 * Handles digit-letter boundaries: "tahap1" → "Tahap 1", "btn" → "BTN".
 */
export function formatIdentifier(id: string | null | undefined): string {
  if (!id) return "";
  return id
    .toLowerCase()
    .split("_")
    .map((w) => w.replace(/([a-z])(\d)/g, "$1 $2").replace(/(\d)([a-z])/g, "$1 $2"))
    .join(" ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bBtn\b/g, "BTN")
    .replace(/\bBri\b/g, "BRI")
    .replace(/\bBca\b/g, "BCA");
}

/** Converts a requestor DB identifier to a display name. Never returns empty for a non-empty input. */
export function formatRequestorName(requestor: string | null | undefined): string {
  if (!requestor) return "";
  const key = requestor.toLowerCase();
  // Exact match
  if (REQUESTOR_LABELS[key]) return REQUESTOR_LABELS[key];
  // Prefix match (handles truncated identifiers in the DB)
  for (const [k, v] of Object.entries(REQUESTOR_LABELS)) {
    if (key.startsWith(k) || k.startsWith(key)) return v;
  }
  // Smart fallback — works for any new person without a code change
  return formatIdentifier(requestor);
}

/** Converts a fund source DB identifier to a display name. */
export function formatFundSource(source: string | null | undefined): string {
  if (!source) return "";
  const upper = source.toUpperCase();
  return FUND_SOURCE_LABELS[upper as FundSource] ?? formatIdentifier(source);
}

/** Converts a status value to its Indonesian label. */
export function formatStatusLabel(status: string | null | undefined): string {
  if (!status) return "";
  return STATUS_LABELS_ID[status.toLowerCase()] ?? formatIdentifier(status);
}
