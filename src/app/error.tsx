"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <h2 className="text-lg font-semibold">Terjadi kesalahan</h2>
      <p className="text-sm text-muted-foreground max-w-md">
        {error.message || "Coba muat ulang halaman ini."}
      </p>
      <button
        onClick={reset}
        className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        Coba lagi
      </button>
    </div>
  );
}
