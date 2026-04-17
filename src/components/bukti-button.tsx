"use client";

import { useRef, useState, useTransition } from "react";
import { Paperclip, Upload, Trash2, ExternalLink, FileText, Image as ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { uploadBuktiAction, deleteBuktiAction } from "@/lib/actions/bukti";
import { cn } from "@/lib/utils";

interface BuktiButtonProps {
  obligationId: string;
  buktiUrl?: string | null;
  buktiType?: string | null;
  itemLabel?: string;
}

export function BuktiButton({
  obligationId,
  buktiUrl,
  buktiType,
  itemLabel,
}: BuktiButtonProps) {
  const [open, setOpen] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(buktiUrl ?? null);
  const [currentType, setCurrentType] = useState(buktiType ?? null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const hasBukti = !!currentUrl;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    startTransition(async () => {
      const res = await uploadBuktiAction(obligationId, fd);
      if ("error" in res) {
        setError(res.error);
      } else {
        setCurrentUrl(res.url ?? null);
        setCurrentType(file.type.startsWith("image/") ? "foto" : "pdf");
      }
    });
    // reset input
    e.target.value = "";
  }

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const res = await deleteBuktiAction(obligationId);
      if ("error" in res) {
        setError(res.error);
      } else {
        setCurrentUrl(null);
        setCurrentType(null);
      }
    });
  }

  const isImage = currentType === "foto" || currentUrl?.match(/\.(jpg|jpeg|png|webp|heic)$/i);
  const isPdf = currentType === "pdf" || currentUrl?.endsWith(".pdf");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <span
          className={cn(
            "inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded p-0 text-sm transition-colors hover:bg-accent",
            hasBukti
              ? "text-emerald-600 hover:text-emerald-700"
              : "text-muted-foreground hover:text-foreground",
          )}
          title={hasBukti ? "Lihat bukti" : "Upload bukti"}
        >
          <Paperclip className="h-3.5 w-3.5" />
        </span>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Paperclip className="h-4 w-4" />
            Bukti Transfer / Nota
          </DialogTitle>
          {itemLabel && (
            <p className="text-xs text-muted-foreground mt-1 truncate">{itemLabel}</p>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview area */}
          {currentUrl ? (
            <div className="rounded-lg border bg-muted/30 overflow-hidden">
              {isImage ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentUrl}
                    alt="Bukti"
                    className="w-full max-h-72 object-contain bg-black/5"
                  />
                </div>
              ) : isPdf ? (
                <div className="flex items-center gap-3 p-4">
                  <FileText className="h-8 w-8 text-red-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Dokumen PDF</p>
                    <p className="text-xs text-muted-foreground truncate">{currentUrl.split("/").pop()}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4">
                  <ImageIcon className="h-8 w-8 text-blue-500 shrink-0" />
                  <p className="text-sm text-muted-foreground">File terlampir</p>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center">
              <Paperclip className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Belum ada bukti terlampir</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                JPG, PNG, WEBP, HEIC, PDF · maks 10MB
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <X className="h-3 w-3 shrink-0" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1"
              disabled={isPending}
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              {isPending ? "Uploading..." : hasBukti ? "Ganti Bukti" : "Upload Bukti"}
            </Button>

            {hasBukti && (
              <>
                <a
                  href={currentUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm font-medium hover:bg-accent"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Buka
                </a>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  disabled={isPending}
                  onClick={handleDelete}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
