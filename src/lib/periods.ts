const MONTH_NAMES_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const MONTH_NAMES_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

// WITA (Asia/Makassar) reference — Vercel containers run UTC so naive new Date() skews the month
// during the 16:00–23:59 UTC window (00:00–08:00 WITA next day).
export function currentWitaMonth(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Makassar",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  return `${y}-${m}`;
}

export function recentMonths(count: number, from?: string): string[] {
  const base = from ?? currentWitaMonth();
  const [y, m] = base.split("-").map(Number);
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(Date.UTC(y, m - 1 - i, 1));
    out.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

export function monthLabel(period: string | null | undefined, style: "short" | "long" = "short"): string {
  if (!period || typeof period !== "string") return "—";
  const [y, m] = period.split("-");
  if (y == null || m == null) return "—";
  const idx = Number(m) - 1;
  const names = style === "long" ? MONTH_NAMES_ID : MONTH_NAMES_SHORT;
  return `${names[idx] ?? m} ${y}`;
}

/** Inclusive `YYYY-MM` range from `from` through `to` (ascending). */
export function monthsInclusiveRange(from: string, to: string): string[] {
  const out: string[] = [];
  const [fy, fm] = from.split("-").map(Number);
  const [ty, tm] = to.split("-").map(Number);
  let y = fy;
  let m = fm;
  while (y < ty || (y === ty && m <= tm)) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out;
}
