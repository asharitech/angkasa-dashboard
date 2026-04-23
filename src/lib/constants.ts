import { CheckCircle2, Clock, XCircle } from "lucide-react";

export const statusStyles: Record<string, string> = {
  pending: "bg-warning/15 text-warning border-warning/20",
  approved: "bg-info/15 text-info border-info/20",
  rejected: "bg-destructive/15 text-destructive border-destructive/20",
  lunas: "bg-success/15 text-success border-success/20",
  active: "bg-success/15 text-success border-success/20",
  running: "bg-info/15 text-info border-info/20",
  hold: "bg-warning/15 text-warning border-warning/20",
  inactive: "bg-destructive/15 text-destructive border-destructive/20",
};

export const statusIcons: Record<string, typeof Clock> = {
  pending: Clock,
  approved: CheckCircle2,
  rejected: XCircle,
  lunas: CheckCircle2,
};
