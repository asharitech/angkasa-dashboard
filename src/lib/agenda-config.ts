import type { AgendaKategori } from "@/lib/actions/agenda";

export const KATEGORI_CONFIG: Record<
  AgendaKategori,
  { label: string; emoji: string; cls: string }
> = {
  yayasan:     { label: "Yayasan",     emoji: "🏛️", cls: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" },
  keuangan:    { label: "Keuangan",    emoji: "💰", cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  pribadi:     { label: "Pribadi",     emoji: "👤", cls: "bg-sky-500/10 text-sky-600 border-sky-500/20" },
  operasional: { label: "Operasional", emoji: "⚙️", cls: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
  rapat:       { label: "Rapat",       emoji: "📋", cls: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  perjalanan:  { label: "Perjalanan",  emoji: "🚗", cls: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  lainnya:     { label: "Lainnya",     emoji: "📌", cls: "bg-slate-500/10 text-slate-600 border-slate-500/20" },
};

export type DueStatus = "terlambat" | "hari_ini" | "besok" | "segera" | "normal" | "selesai";

export function getDueStatus(dueDate: string, status: string): DueStatus {
  if (status === "selesai") return "selesai";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diff = Math.round((due.getTime() - today.getTime()) / 86_400_000);
  if (diff < 0) return "terlambat";
  if (diff === 0) return "hari_ini";
  if (diff === 1) return "besok";
  if (diff <= 5) return "segera";
  return "normal";
}
