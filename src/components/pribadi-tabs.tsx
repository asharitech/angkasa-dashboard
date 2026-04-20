"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export type PribadiView = "ringkasan" | "akun" | "cicilan" | "numpang" | "pengeluaran";

const VIEWS: PribadiView[] = ["ringkasan", "akun", "cicilan", "numpang", "pengeluaran"];
const VIEW_LABEL: Record<PribadiView, string> = {
  ringkasan: "Ringkasan",
  akun: "Akun",
  cicilan: "Cicilan & Piutang",
  numpang: "Numpang",
  pengeluaran: "Pengeluaran",
};

export function PribadiTabs({
  ringkasan,
  akun,
  cicilan,
  numpang,
  pengeluaran,
}: {
  ringkasan: React.ReactNode;
  akun: React.ReactNode;
  cicilan: React.ReactNode;
  numpang: React.ReactNode;
  pengeluaran: React.ReactNode;
}) {
  const [activeView, setActiveView] = useState<PribadiView>("ringkasan");

  const panels: Record<PribadiView, React.ReactNode> = {
    ringkasan,
    akun,
    cicilan,
    numpang,
    pengeluaran,
  };

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

      {/* Active panel */}
      {panels[activeView]}
    </>
  );
}
