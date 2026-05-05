/**
 * Pathname → short title for mobile header & a11y. Longest prefix wins (except `/`).
 */
const ENTRIES: [string, string][] = [
  ["/wajib-bulanan", "Wajib Bulanan"],
  ["/laporan-op", "Laporan Op"],
  ["/pengajuan", "Pengajuan"],
  ["/dana-cash", "Cash Yayasan"],
  ["/notifikasi", "Notifikasi"],
  ["/pemantauan", "Pemantauan"],
  ["/anggaran", "Anggaran"],
  ["/cicilan", "Cicilan Bulanan"],
  ["/savings", "Savings"],
  ["/pribadi", "Pengeluaran"],
  ["/dokumen", "Dokumen"],
  ["/ompreng", "Ompreng"],
  ["/sewa", "Sewa Dapur"],
  ["/agenda", "Agenda"],
  ["/aktivitas", "Aktivitas"],
  ["/duplikat", "Cek Duplikat"],
  ["/audit", "Audit Data"],
  ["/users", "Users"],
  ["/admin", "Master Data"],
  ["/transaksi", "Transaksi"],
  ["/dana-pribadi", "Pribadi"],
  ["/", "Yayasan"],
];

export function dashboardRouteTitle(pathname: string | null | undefined): string {
  if (!pathname) return "Angkasa";
  if (pathname === "/") return "Yayasan";
  const sorted = ENTRIES.filter(([p]) => p !== "/").sort((a, b) => b[0].length - a[0].length);
  for (const [prefix, label] of sorted) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return label;
  }
  return "Angkasa";
}
