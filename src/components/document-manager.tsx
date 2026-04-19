"use client";

import { useState, useTransition, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  uploadDocumentAction,
  updateDocumentAction,
  deleteDocumentAction,
  type DocKategori,
} from "@/lib/actions/documents";
import {
  Plus,
  Upload,
  Trash2,
  Pencil,
  Loader2,
  AlertTriangle,
  FileText,
  FileImage,
  FileSpreadsheet,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const KATEGORI_DOC_CONFIG: Record<
  DocKategori,
  { label: string; emoji: string; cls: string }
> = {
  akta:       { label: "Akta",        emoji: "📜", cls: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  sk:         { label: "SK",          emoji: "🏛️", cls: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" },
  surat:      { label: "Surat",       emoji: "✉️", cls: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  kontrak:    { label: "Kontrak",     emoji: "🤝", cls: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  laporan:    { label: "Laporan",     emoji: "📊", cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  perizinan:  { label: "Perizinan",   emoji: "✅", cls: "bg-teal-500/10 text-teal-600 border-teal-500/20" },
  keuangan:   { label: "Keuangan",    emoji: "💰", cls: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
  lainnya:    { label: "Lainnya",     emoji: "📁", cls: "bg-slate-500/10 text-slate-600 border-slate-500/20" },
};

export function fileTypeIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return FileImage;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return FileSpreadsheet;
  return FileText;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Upload Button ────────────────────────────────────────────────────────────

export function DocumentUploadButton() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(file: File) {
    setSelectedFile(file);
    setError(null);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedFile) {
      setError("Pilih file terlebih dahulu");
      return;
    }
    const form = new FormData(e.currentTarget);
    form.set("file", selectedFile);
    setError(null);
    startTransition(async () => {
      const res = await uploadDocumentAction(form);
      if ("error" in res) {
        setError(res.error);
      } else {
        setOpen(false);
        setSelectedFile(null);
      }
    });
  }

  function handleClose() {
    setOpen(false);
    setSelectedFile(null);
    setError(null);
  }

  return (
    <>
      <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
        <Upload className="h-4 w-4" />
        Upload Dokumen
      </Button>

      <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Dokumen Yayasan</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors",
                dragOver
                  ? "border-primary bg-primary/5"
                  : selectedFile
                  ? "border-emerald-500/60 bg-emerald-500/5"
                  : "border-border/60 bg-muted/20 hover:border-primary/40 hover:bg-muted/40",
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileSelect(f);
                }}
              />
              {selectedFile ? (
                <>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                    <FileText className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-emerald-600">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Klik untuk ganti file</p>
                </>
              ) : (
                <>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Klik atau drag file ke sini</p>
                    <p className="text-xs text-muted-foreground">PDF, Word, Excel, JPG, PNG — maks 20MB</p>
                  </div>
                </>
              )}
            </div>

            {/* Judul */}
            <div className="space-y-1.5">
              <Label htmlFor="doc-judul">Judul Dokumen *</Label>
              <Input
                id="doc-judul"
                name="judul"
                placeholder="Contoh: Akta Pendirian Yayasan 2024"
                defaultValue={selectedFile ? selectedFile.name.replace(/\.[^.]+$/, "") : ""}
                required
              />
            </div>

            {/* Kategori */}
            <div className="space-y-1.5">
              <Label htmlFor="doc-kategori">Kategori</Label>
              <Select name="kategori" defaultValue="lainnya">
                <SelectTrigger id="doc-kategori">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(KATEGORI_DOC_CONFIG) as [DocKategori, typeof KATEGORI_DOC_CONFIG[DocKategori]][]).map(
                    ([key, cfg]) => (
                      <SelectItem key={key} value={key}>
                        {cfg.emoji} {cfg.label}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Keterangan */}
            <div className="space-y-1.5">
              <Label htmlFor="doc-keterangan">Keterangan</Label>
              <Textarea
                id="doc-keterangan"
                name="keterangan"
                placeholder="Nomor dokumen, tanggal, catatan..."
                rows={2}
              />
            </div>

            {error && (
              <p className="flex items-center gap-1.5 text-sm text-destructive">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={handleClose}>
                Batal
              </Button>
              <Button type="submit" disabled={pending || !selectedFile}>
                {pending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                {pending ? "Mengupload..." : "Simpan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Document types ───────────────────────────────────────────────────────────

export interface DocumentDoc {
  _id: string;
  judul: string;
  kategori: DocKategori;
  keterangan?: string | null;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  created_at: string;
  updated_at: string;
}

// ─── Row Actions ──────────────────────────────────────────────────────────────

export function DocumentRowActions({ doc }: { doc: DocumentDoc }) {
  const [pending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const res = await updateDocumentAction(doc._id, {
        judul: form.get("judul") as string,
        kategori: form.get("kategori") as DocKategori,
        keterangan: (form.get("keterangan") as string) || null,
      });
      if ("error" in res) setError(res.error);
      else setEditOpen(false);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteDocumentAction(doc._id);
      setDeleteOpen(false);
    });
  }

  return (
    <>
      <button
        onClick={() => setEditOpen(true)}
        title="Edit"
        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => setDeleteOpen(true)}
        title="Hapus"
        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Dokumen</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-judul">Judul *</Label>
              <Input id="edit-judul" name="judul" defaultValue={doc.judul} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-kategori">Kategori</Label>
              <Select name="kategori" defaultValue={doc.kategori}>
                <SelectTrigger id="edit-kategori">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(KATEGORI_DOC_CONFIG) as [DocKategori, typeof KATEGORI_DOC_CONFIG[DocKategori]][]).map(
                    ([key, cfg]) => (
                      <SelectItem key={key} value={key}>
                        {cfg.emoji} {cfg.label}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-keterangan">Keterangan</Label>
              <Textarea
                id="edit-keterangan"
                name="keterangan"
                defaultValue={doc.keterangan ?? ""}
                rows={2}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Batal</Button>
              <Button type="submit" disabled={pending}>
                {pending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                Simpan
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Hapus Dokumen?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">&ldquo;{doc.judul}&rdquo;</span>{" "}
            akan dihapus permanen dari storage.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={pending}>
              {pending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Hapus
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
