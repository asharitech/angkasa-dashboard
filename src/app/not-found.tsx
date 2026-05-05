import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 p-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <FileQuestion className="h-7 w-7" aria-hidden />
      </div>
      <div className="space-y-1.5">
        <h2 className="text-lg font-semibold tracking-tight">Halaman tidak ditemukan</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Periksa kembali URL atau kembali ke beranda.
        </p>
      </div>
      <Link href="/" className={cn(buttonVariants({ size: "sm" }))}>
        Kembali ke beranda
      </Link>
    </div>
  );
}
