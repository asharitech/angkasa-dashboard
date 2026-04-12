import { CheckCircle2, Clock, XCircle } from "lucide-react";

export const statusStyles: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  reimbursed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  approved: "bg-blue-50 text-blue-700 border-blue-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
  lunas: "bg-emerald-50 text-emerald-700 border-emerald-200",
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  running: "bg-blue-50 text-blue-700 border-blue-200",
  hold: "bg-amber-50 text-amber-700 border-amber-200",
  inactive: "bg-rose-50 text-rose-700 border-rose-200",
};

export const statusIcons: Record<string, typeof Clock> = {
  pending: Clock,
  reimbursed: CheckCircle2,
  approved: CheckCircle2,
  rejected: XCircle,
  lunas: CheckCircle2,
};
