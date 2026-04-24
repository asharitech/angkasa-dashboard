import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6 text-center">
      <h2 className="text-lg font-semibold">Halaman tidak ditemukan</h2>
      <p className="text-sm text-muted-foreground">Periksa kembali URL atau kembali ke beranda.</p>
      <Link
        href="/"
        className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        Kembali ke beranda
      </Link>
    </div>
  );
}
