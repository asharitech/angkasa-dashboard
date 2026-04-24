"use client";

import { useState } from "react";
import { TabBar } from "@/components/primitives/tab-bar";

export type SewaView = "lokasi" | "operasional" | "riwayat" | "referensi";

const TABS: { value: SewaView; label: string }[] = [
  { value: "lokasi",      label: "Lokasi" },
  { value: "operasional", label: "Operasional" },
  { value: "riwayat",     label: "Riwayat" },
  { value: "referensi",   label: "Referensi" },
];

export function SewaTabs({
  lokasi,
  operasional,
  riwayat,
  referensi,
}: {
  lokasi: React.ReactNode;
  operasional: React.ReactNode;
  riwayat: React.ReactNode;
  referensi: React.ReactNode;
}) {
  const [activeView, setActiveView] = useState<SewaView>("lokasi");

  const panels: Record<SewaView, React.ReactNode> = {
    lokasi,
    operasional,
    riwayat,
    referensi,
  };

  return (
    <>
      <TabBar tabs={TABS} value={activeView} onChange={setActiveView} />
      {panels[activeView]}
    </>
  );
}
