/**
 * Normalized rows for displaying Laporan Op "kewajiban" breakdown in UI.
 * Single source for home dashboard vs Laporan Op page.
 */

export type KewajibanInput = {
  total: number;
  dana_pinjam_angkasa_tahap1?: number;
  dana_pinjam_angkasa_tahap2?: number;
  dana_pinjam_angkasa_tahap3?: number;
  lembar2_btn?: number;
  pinjaman_btn?: number;
};

export function kewajibanRows(
  k: KewajibanInput | Record<string, number | undefined>,
  options?: { includeTotal?: boolean },
): [string, number][] {
  const includeTotal = options?.includeTotal ?? false;
  const ka = k as Record<string, number | undefined>;

  if (ka.dana_pinjam_angkasa_tahap1 != null) {
    const base: [string, number | undefined][] = [
      ["Dana Pinjam Angkasa Tahap 1", ka.dana_pinjam_angkasa_tahap1],
      ["Dana Pinjam Angkasa Tahap 2", ka.dana_pinjam_angkasa_tahap2],
      ["Dana Pinjam Angkasa Tahap 3", ka.dana_pinjam_angkasa_tahap3],
    ];
    if (includeTotal) base.push(["Total", (k as KewajibanInput).total]);
    return base.filter((r): r is [string, number] => r[1] != null);
  }

  const base: [string, number | undefined][] = [
    ["Lembar2 BTN", ka.lembar2_btn],
    ["Pinjaman BTN", ka.pinjaman_btn],
  ];
  if (includeTotal) base.push(["Total", (k as KewajibanInput).total]);
  return base.filter((r): r is [string, number] => r[1] != null);
}
