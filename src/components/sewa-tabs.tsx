"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export type SewaView = "lokasi" | "operasional" | "riwayat" | "referensi";

const VIEWS: SewaView[] = ["lokasi", "operasional", "riwayat", "referensi"];
const VIEW_LABEL: Record<SewaView, string> = {
  lokasi: "Lokasi",
  operasional: "Operasional",
  riwayat: "Riwayat",
  referensi: "Referensi",
};

export function SewaTabs({
  children,
}: {
  children: (activeView: SewaView) => React.ReactNode;
}) {
  const [activeView, setActiveView] = useState<SewaView>("lokasi");

  return (
    <>
      {/* Tab bar */}
      <div className="inline-flex w-full max-w-full overflow-hidden">
        <div className="inline-flex min-w-0 gap-1 overflow-x-auto rounded-lg bg-muted/60 p-1 scrollbar-none">
          {VIEWS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setActiveView(v)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                activeView === v
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {VIEW_LABEL[v]}
            </button>
          ))}
        </div>
      </div>

      {/* Active view content */}
      {children(activeView)}
    </>
  );
}
