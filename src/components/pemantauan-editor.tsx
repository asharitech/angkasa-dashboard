"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DASHBOARD_INSET_PANEL } from "@/lib/dashboard-card-shell";
import { cn } from "@/lib/utils";
import { Pencil, Trash2, Plus, X, Check } from "lucide-react";

export interface TemuanItem {
  id: string;
  deskripsi: string;
  kategori: string;
  status: "belum" | "sedang" | "selesai";
  catatan?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PemantauanDoc {
  _id: string;
  lokasi_code: string;
  lokasi_name: string;
  holder: string;
  region: string;
  bgn_code: string;
  tanggal_pemantauan?: string | null;
  temuan: TemuanItem[];
  kolom_belum?: string[];
  status_keseluruhan: "aman" | "perlu_perhatian" | "kritis";
  notes?: string | null;
}

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

function temuanStatusLabel(s: string) {
  switch (s) {
    case "selesai": return "Selesai";
    case "sedang": return "Sedang";
    case "belum": return "Belum";
    default: return s;
  }
}

export function PemantauanCard({
  doc,
  onUpdate,
}: {
  doc: PemantauanDoc;
  onUpdate?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [temuan, setTemuan] = useState<TemuanItem[]>(doc.temuan);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/pemantauan/${doc._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ temuan }),
      });
      if (res.ok) {
        setEditing(false);
        onUpdate?.();
      }
    } finally {
      setSaving(false);
    }
  }

  function addTemuan() {
    setTemuan((prev) => [
      ...prev,
      {
        id: generateId(),
        deskripsi: "",
        kategori: "",
        status: "belum",
        catatan: "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
  }

  function removeTemuan(idx: number) {
    setTemuan((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateTemuan(idx: number, patch: Partial<TemuanItem>) {
    setTemuan((prev) =>
      prev.map((t, i) => (i === idx ? { ...t, ...patch, updated_at: new Date().toISOString() } : t))
    );
  }

  return (
    <div
      className={cn(
        DASHBOARD_INSET_PANEL,
        "p-3",
        doc.temuan.length > 0 && "border-warning/20 bg-warning/5",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold">{doc.lokasi_name}</span>
            <Badge variant="secondary" className="text-[10px]">{doc.bgn_code}</Badge>
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="tabular-nums">{doc.region}</span>
            {doc.tanggal_pemantauan && (
              <span className="tabular-nums">· dipantau {formatTanggal(doc.tanggal_pemantauan)}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Badge
            variant={
              doc.status_keseluruhan === "perlu_perhatian"
                ? "warning"
                : doc.status_keseluruhan === "kritis"
                ? "destructive"
                : "success"
            }
            className="text-xs"
          >
            {doc.status_keseluruhan === "perlu_perhatian"
              ? "Perlu Perhatian"
              : doc.status_keseluruhan === "kritis"
              ? "Kritis"
              : "Aman"}
          </Badge>
          <button
            onClick={() => setEditing((e) => !e)}
            className="ml-1 p-1 rounded-md hover:bg-muted transition-colors"
            title={editing ? "Batal" : "Edit"}
          >
            {editing ? <X className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Temuan list */}
      <div className="mt-2.5 space-y-1.5">
        {temuan.map((t, idx) => (
          <div key={t.id} className="flex items-start gap-2 rounded-md bg-card px-2.5 py-2">
            <span className="mt-0.5 text-xs font-medium text-muted-foreground tabular-nums shrink-0">
              {idx + 1}.
            </span>
            {editing ? (
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex gap-1.5">
                  <Input
                    value={t.deskripsi}
                    onChange={(e) => updateTemuan(idx, { deskripsi: e.target.value })}
                    placeholder="Deskripsi temuan..."
                    className="h-7 text-sm flex-1"
                  />
                  <select
                    value={t.status}
                    onChange={(e) => updateTemuan(idx, { status: e.target.value as TemuanItem["status"] })}
                    className="h-7 text-xs rounded-md border border-input bg-background px-2"
                  >
                    <option value="belum">Belum</option>
                    <option value="sedang">Sedang</option>
                    <option value="selesai">Selesai</option>
                  </select>
                  <button
                    onClick={() => removeTemuan(idx)}
                    className="p-1 rounded-md hover:bg-destructive/10 text-destructive transition-colors"
                    title="Hapus"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug">{t.deskripsi}</p>
                {t.catatan && <p className="mt-0.5 text-xs text-muted-foreground">{t.catatan}</p>}
              </div>
            )}
            {!editing && (
              <Badge
                variant={t.status === "selesai" ? "success" : t.status === "sedang" ? "info" : "warning"}
                className="shrink-0 text-[10px]"
              >
                {temuanStatusLabel(t.status)}
              </Badge>
            )}
          </div>
        ))}

        {editing && (
          <button
            onClick={addTemuan}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            <Plus className="h-3.5 w-3.5" />
            Tambah temuan
          </button>
        )}
      </div>

      {/* Kolom belum */}
      {doc.kolom_belum && doc.kolom_belum.length > 0 && !editing && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {doc.kolom_belum.map((k) => (
            <Badge key={k} variant="outline" className="text-[10px]">{k}</Badge>
          ))}
        </div>
      )}

      {editing && (
        <div className="mt-3 flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => { setEditing(false); setTemuan(doc.temuan); }} disabled={saving}>
            Batal
          </Button>
          <Button size="sm" onClick={save} disabled={saving}>
            <Check className="h-3.5 w-3.5 mr-1" />
            {saving ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      )}
    </div>
  );
}

function formatTanggal(tanggal: string | null | undefined) {
  if (!tanggal) return "—";
  const [y, m, d] = tanggal.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
