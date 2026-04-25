/**
 * Normalized rows for displaying Laporan Op "kewajiban" breakdown in UI.
 * Single source of truth for home dashboard and Laporan Op page.
 *
 * Dynamically reads ALL numeric fields from the kewajiban object — adding a new
 * loan field to the DB snapshot automatically shows it here, no code change needed.
 * LABEL_OVERRIDES provides pretty-printed names for known fields; unknown fields
 * get auto-formatted labels as a safe fallback.
 */

/** Pretty labels for known kewajiban fields. Unknown fields auto-format. */
const LABEL_OVERRIDES: Record<string, string> = {
  dana_pinjam_angkasa_tahap1: "Dana Pinjam Angkasa Tahap 1",
  dana_pinjam_angkasa_tahap2: "Dana Pinjam Angkasa Tahap 2",
  dana_pinjam_angkasa_tahap3: "Dana Pinjam Angkasa Tahap 3",
  dana_pinjam_angkasa_tahap4: "Dana Pinjam Angkasa Tahap 4",
  lembar2_btn: "Lembar 2 BTN",
  pinjaman_btn: "Pinjaman BTN",
  pinjaman_btn_awal: "Pinjaman BTN Awal",
  pinjaman_btn_sumare: "Pinjaman BTN Sumare",
};

/** Auto-formats a snake_case field name into a human-readable label. */
function autoLabel(key: string): string {
  return key
    .split("_")
    .map((word) =>
      // Insert space between letters and digits: "tahap1" → "tahap 1"
      word.replace(/([a-z])(\d)/g, "$1 $2").replace(/(\d)([a-z])/g, "$1 $2"),
    )
    .join(" ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    // Known abbreviations that should stay uppercase
    .replace(/\bBtn\b/g, "BTN")
    .replace(/\bBri\b/g, "BRI")
    .replace(/\bBca\b/g, "BCA");
}

/**
 * Returns `[label, amount]` pairs for every kewajiban field with a positive value.
 * Works with any shape of kewajiban object — new fields appear automatically.
 */
export function kewajibanRows(
  kewajiban: Record<string, unknown> | object,
  options?: { includeTotal?: boolean },
): [string, number][] {
  const rows: [string, number][] = [];

  for (const [key, val] of Object.entries(kewajiban)) {
    if (key === "total" && !options?.includeTotal) continue;
    if (typeof val !== "number" || val <= 0) continue;
    const label = LABEL_OVERRIDES[key] ?? autoLabel(key);
    rows.push([label, val]);
  }

  // Stable order: known overrides first (in definition order), then alphabetical
  const knownKeys = Object.keys(LABEL_OVERRIDES);
  rows.sort(([a], [b]) => {
    const ai = knownKeys.indexOf(
      Object.keys(LABEL_OVERRIDES).find((k) => LABEL_OVERRIDES[k] === a) ?? "",
    );
    const bi = knownKeys.indexOf(
      Object.keys(LABEL_OVERRIDES).find((k) => LABEL_OVERRIDES[k] === b) ?? "",
    );
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.localeCompare(b);
  });

  return rows;
}

// Re-export for type-safety when callers need just the label map
export { LABEL_OVERRIDES as KEWAJIBAN_LABEL_OVERRIDES };
