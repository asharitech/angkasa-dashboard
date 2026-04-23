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
  neutral: "bg-secondary text-secondary-foreground border-border",
  primary: "bg-primary/10 text-primary border-primary/20",
  success: "bg-success/15 text-success border-success/20",
  warning: "bg-warning/15 text-warning border-warning/20",
  danger: "bg-destructive/15 text-destructive border-destructive/20",
  info: "bg-info/15 text-info border-info/20",
  muted: "bg-muted text-muted-foreground border-border",
};

export const toneIcon: Record<Tone, { bg: string; fg: string }> = {
  neutral: { bg: "bg-secondary", fg: "text-secondary-foreground" },
  primary: { bg: "bg-primary/10", fg: "text-primary" },
  success: { bg: "bg-success/15", fg: "text-success" },
  warning: { bg: "bg-warning/15", fg: "text-warning" },
  danger: { bg: "bg-destructive/15", fg: "text-destructive" },
  info: { bg: "bg-info/15", fg: "text-info" },
  muted: { bg: "bg-muted", fg: "text-muted-foreground" },
};

export const toneText: Record<Tone, string> = {
  neutral: "text-secondary-foreground",
  primary: "text-primary",
  success: "text-success",
  warning: "text-warning",
  danger: "text-destructive",
  info: "text-info",
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
