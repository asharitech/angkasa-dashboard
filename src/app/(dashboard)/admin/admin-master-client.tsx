"use client";

import { useCallback, useState, useTransition } from "react";
import { SectionCard } from "@/components/section-card";
import { DASHBOARD_INSET_PANEL } from "@/lib/dashboard-card-shell";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Loader2, Save, Trash2, Code } from "lucide-react";
import { updateRawDocumentAction, deleteRawDocumentAction } from "@/lib/actions/admin";
import { ADMIN_RAW_COLLECTIONS } from "@/lib/admin-raw-collections";

export function AdminMasterClient() {
  const [collection, setCollection] = useState<string>(ADMIN_RAW_COLLECTIONS[0] ?? "entries");
  const [docId, setDocId] = useState("");
  const [docData, setDocData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [jsonInput, setJsonInput] = useState("");
  const [pending, start] = useTransition();

  const pullDocument = useCallback(
    async (clearFirst: boolean) => {
      if (!docId) return;
      if (clearFirst) {
        setDocData(null);
        setJsonInput("");
      }
      setLoading(true);
      setError(null);
      if (clearFirst) setSuccess(null);
      try {
        const q = new URLSearchParams({ collection, id: docId });
        const res = await fetch(`/api/admin/fetch-doc?${q.toString()}`);
        const data = (await res.json()) as { error?: string; doc?: Record<string, unknown> };
        if (data.error) {
          setError(data.error);
        } else if (data.doc) {
          setDocData(data.doc);
          setJsonInput(JSON.stringify(data.doc, null, 2));
        }
      } catch {
        setError("Gagal mengambil dokumen");
      } finally {
        setLoading(false);
      }
    },
    [collection, docId]
  );

  async function handleFetch() {
    if (!docId) return;
    await pullDocument(true);
  }

  function handleSave() {
    try {
      const parsed = JSON.parse(jsonInput) as Record<string, unknown>;
      setSuccess(null);
      start(async () => {
        const res = await updateRawDocumentAction(collection, docId, parsed);
        if (res.error) {
          setError(res.error);
          return;
        }
        setError(null);
        await pullDocument(false);
        setSuccess("Dokumen berhasil diperbarui.");
      });
    } catch {
      setError("Format JSON tidak valid");
    }
  }

  function handleDelete() {
    if (!confirm("Hapus dokumen ini secara permanen?")) return;
    setSuccess(null);
    start(async () => {
      const res = await deleteRawDocumentAction(collection, docId);
      if (res.error) {
        setError(res.error);
        return;
      }
      setError(null);
      setDocData(null);
      setJsonInput("");
      setSuccess("Dokumen berhasil dihapus.");
    });
  }

  return (
    <SectionCard icon={Search} title="Cari & Edit Dokumen (Raw)" tone="muted">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Koleksi</Label>
              <select
                value={collection}
                onChange={(e) => setCollection(e.target.value)}
                className={cn(
                  DASHBOARD_INSET_PANEL,
                  "w-full bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                )}
              >
                {ADMIN_RAW_COLLECTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Document ID</Label>
              <Input
                value={docId}
                onChange={(e) => setDocId(e.target.value)}
                placeholder="ObjectId atau String ID"
              />
            </div>
          </div>
          <Button onClick={() => void handleFetch()} disabled={loading || !docId} className="w-full">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            Ambil Dokumen
          </Button>

          {error && <p className="text-sm text-destructive font-medium">{error}</p>}
          {success && (
            <p className="text-sm font-medium text-success rounded-md border border-success/25 bg-success/10 px-3 py-2" role="status">
              {success}
            </p>
          )}

          {docData && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <Code className="h-4 w-4" /> Raw JSON Editor
                </h4>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleSave} disabled={pending}>
                    {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3 mr-1.5" />}
                    Simpan
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleDelete} className="text-destructive" disabled={pending}>
                    <Trash2 className="h-3 w-3 mr-1.5" />
                    Hapus
                  </Button>
                </div>
              </div>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className={cn(
                  DASHBOARD_INSET_PANEL,
                  "h-96 w-full resize-y bg-muted/20 p-3 font-mono text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                )}
              />
            </div>
          )}
        </div>
      </SectionCard>
  );
}
