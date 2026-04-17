// Single source of truth for semantic color tokens.
// Pages should import from here instead of inlining Tailwind class strings.

export type Tone =
  | "neutral"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "muted";

export const toneBadge: Record<Tone, string> = {
  neutral: "bg-slate-50 text-slate-700 border-slate-200",
  primary: "bg-primary/10 text-primary border-primary/20",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger: "bg-rose-50 text-rose-700 border-rose-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
  muted: "bg-muted text-muted-foreground border-border",
};

export const toneIcon: Record<Tone, { bg: string; fg: string }> = {
  neutral: { bg: "bg-slate-100", fg: "text-slate-600" },
  primary: { bg: "bg-primary/10", fg: "text-primary" },
  success: { bg: "bg-emerald-100", fg: "text-emerald-600" },
  warning: { bg: "bg-amber-100", fg: "text-amber-600" },
  danger: { bg: "bg-rose-100", fg: "text-rose-600" },
  info: { bg: "bg-blue-100", fg: "text-blue-600" },
  muted: { bg: "bg-muted", fg: "text-muted-foreground" },
};

export const toneText: Record<Tone, string> = {
  neutral: "text-slate-700",
  primary: "text-primary",
  success: "text-emerald-600",
  warning: "text-amber-600",
  danger: "text-rose-600",
  info: "text-blue-600",
  muted: "text-muted-foreground",
};

// Map domain enums to a Tone so each page picks the same color for the same concept.
export function obligationStatusTone(status: string): Tone {
  switch (status) {
    case "lunas":
    case "reimbursed":
    case "settled":
      return "success";
    case "pending":
      return "warning";
    case "active":
      return "info";
    case "cancelled":
      return "danger";
    default:
      return "neutral";
  }
}

export function entryDirectionTone(direction: "in" | "out"): Tone {
  return direction === "in" ? "success" : "danger";
}

export function severityTone(severity: "error" | "warn" | "info"): Tone {
  return severity === "error" ? "danger" : severity === "warn" ? "warning" : "info";
}

export function sewaStageTone(stage: string): Tone {
  switch (stage) {
    case "diterima":
    case "received":
      return "success";
    case "transit":
    case "transfer":
      return "info";
    case "belum":
    case "pending":
      return "warning";
    default:
      return "neutral";
  }
}
