"use client";

import { useState, useTransition } from "react";
import { SectionCard } from "@/components/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Loader2, Save, Trash2, Code } from "lucide-react";
import { updateRawDocumentAction, deleteRawDocumentAction } from "@/lib/actions/admin";

export function AdminMasterClient() {
  const [collection, setCollection] = useState("entries");
  const [docId, setDocId] = useState("");
  const [docData, setDocData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jsonInput, setJsonInput] = useState("");
  const [pending, start] = useTransition();

  async function handleFetch() {
    if (!docId) return;
    setLoading(true);
    setError(null);
    setDocData(null);
    
    try {
      const res = await fetch(`/api/admin/fetch-doc?collection=${collection}&id=${docId}`);
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setDocData(data.doc);
        setJsonInput(JSON.stringify(data.doc, null, 2));
      }
    } catch (_err) {
      setError("Gagal mengambil dokumen");
    } finally {
      setLoading(false);
    }
  }

  function handleSave() {
    try {
      const parsed = JSON.parse(jsonInput) as Record<string, unknown>;
      start(async () => {
        const res = await updateRawDocumentAction(collection, docId, parsed);
        if (res.error) {
          setError(res.error);
        } else {
          alert("Dokumen berhasil diupdate!");
          handleFetch();
        }
      });
    } catch (_err) {
      setError("Format JSON tidak valid");
    }
  }

  function handleDelete() {
    if (!confirm("Hapus dokumen ini secara permanen?")) return;
    start(async () => {
      const res = await deleteRawDocumentAction(collection, docId);
      if (res.error) {
        setError(res.error);
      } else {
        alert("Dokumen berhasil dihapus");
        setDocData(null);
        setJsonInput("");
      }
    });
  }

  return (
    <div className="space-y-6">
      <SectionCard icon={Search} title="Cari & Edit Dokumen (Raw)" tone="muted">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Koleksi</Label>
              <select 
                value={collection}
                onChange={(e) => setCollection(e.target.value)}
                className="w-full bg-background border rounded-md px-3 py-2 text-sm"
              >
                <option value="accounts">accounts</option>
                <option value="entries">entries</option>
                <option value="obligations">obligations</option>
                <option value="ledgers">ledgers</option>
                <option value="numpang">numpang</option>
                <option value="agenda">agenda</option>
                <option value="users">users</option>
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
          <Button onClick={handleFetch} disabled={loading || !docId} className="w-full">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            Ambil Dokumen
          </Button>

          {error && <p className="text-sm text-destructive font-medium">{error}</p>}

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
                className="w-full h-96 font-mono text-xs p-3 border rounded-md bg-muted/20"
              />
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
