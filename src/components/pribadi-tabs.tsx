"use client";

import { useState } from "react";
import { TabBar } from "@/components/primitives/tab-bar";

export type PribadiView = "ringkasan" | "akun" | "cicilan" | "numpang" | "pengeluaran";

const TABS: { value: PribadiView; label: string }[] = [
  { value: "ringkasan",   label: "Ringkasan" },
  { value: "akun",        label: "Akun" },
  { value: "cicilan",     label: "Cicilan & Piutang" },
  { value: "numpang",     label: "Numpang" },
  { value: "pengeluaran", label: "Pengeluaran" },
];

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
      <TabBar tabs={TABS} value={activeView} onChange={setActiveView} />
      {panels[activeView]}
    </>
  );
}
