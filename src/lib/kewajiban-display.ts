/**
 * Normalized rows for displaying Laporan Op "kewajiban" breakdown in UI.
 * Single source of truth for home dashboard and Laporan Op page.
 */

export type KewajibanInput = {
  total: number;
  dana_pinjam_angkasa_tahap1?: number;
  dana_pinjam_angkasa_tahap2?: number;
  dana_pinjam_angkasa_tahap3?: number;
  dana_pinjam_angkasa_tahap4?: number;
  lembar2_btn?: number;
  pinjaman_btn?: number;
  pinjaman_btn_awal?: number;
  pinjaman_btn_sumare?: number;
};

export function kewajibanRows(
  k: KewajibanInput | Record<string, number | undefined>,
  options?: { includeTotal?: boolean },
): [string, number][] {
  const includeTotal = options?.includeTotal ?? false;
  const ka = k as Record<string, number | undefined>;

  const rows: [string, number | undefined][] = ka.dana_pinjam_angkasa_tahap1 != null
    ? [
        ["Dana Pinjam Angkasa Tahap 1", ka.dana_pinjam_angkasa_tahap1],
        ["Dana Pinjam Angkasa Tahap 2", ka.dana_pinjam_angkasa_tahap2],
        ["Dana Pinjam Angkasa Tahap 3", ka.dana_pinjam_angkasa_tahap3],
        ["Dana Pinjam Angkasa Tahap 4", ka.dana_pinjam_angkasa_tahap4],
        ["Lembar 2 BTN", ka.lembar2_btn],
        ["Pinjaman BTN", ka.pinjaman_btn],
        ["Pinjaman BTN Awal", ka.pinjaman_btn_awal],
        ["Pinjaman BTN Sumare", ka.pinjaman_btn_sumare],
      ]
    : [
        ["Lembar 2 BTN", ka.lembar2_btn],
        ["Pinjaman BTN", ka.pinjaman_btn],
        ["Pinjaman BTN Awal", ka.pinjaman_btn_awal],
        ["Pinjaman BTN Sumare", ka.pinjaman_btn_sumare],
      ];

  if (includeTotal) rows.push(["Total", (k as KewajibanInput).total]);

  return rows.filter((r): r is [string, number] => r[1] != null && r[1] > 0);
}
