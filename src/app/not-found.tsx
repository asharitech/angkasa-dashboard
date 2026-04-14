import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6 text-center">
      <h2 className="text-lg font-semibold">Halaman tidak ditemukan</h2>
      <p className="text-sm text-muted-foreground">Periksa kembali URL atau kembali ke beranda.</p>
      <Link
        href="/"
        className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
      >
        Kembali ke beranda
      </Link>
    </div>
  );
}
