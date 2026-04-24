"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

const _buttonVariants = cva("", {
  variants: {
    variant: {
      default: "",
      outline: "",
      secondary: "",
      ghost: "",
      destructive: "",
      success: "",
      warning: "",
      info: "",
      link: "",
    },
  },
});
type ButtonVariant = NonNullable<VariantProps<typeof _buttonVariants>["variant"]>;

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Konfirmasi",
  cancelLabel = "Batal",
  confirmVariant = "destructive",
  onConfirm,
  pending = false,
  error,
  icon: Icon = AlertTriangle,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: ButtonVariant;
  onConfirm: () => void;
  pending?: boolean;
  error?: string | null;
  icon?: LucideIcon;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && !pending) onOpenChange(false);
      }}
    >
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive">
              <Icon className="h-4 w-4" />
            </div>
            <DialogTitle>{title}</DialogTitle>
          </div>
          {description && (
            <DialogDescription>
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            {cancelLabel}
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm} disabled={pending}>
            {pending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
