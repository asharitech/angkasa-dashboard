import { CheckCircle2, Clock, XCircle } from "lucide-react";

export const statusIcons: Record<string, typeof Clock> = {
  pending: Clock,
  approved: CheckCircle2,
  rejected: XCircle,
  lunas: CheckCircle2,
};
