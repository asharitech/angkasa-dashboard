import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { SummaryStrip, SummaryCell } from "@/components/summary-strip";
import { FilterTabs } from "@/components/filter-bar";
import {
  DocumentUploadButton,
  DocumentRowActions,
  KATEGORI_DOC_CONFIG,
  fileTypeIcon,
  formatFileSize,
  type DocumentDoc,
} from "@/components/document-manager";
import type { DocKategori } from "@/lib/actions/documents";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import {
  FolderOpen,
  Download,
  FileText,
  ExternalLink,
} from "lucide-react";

export const dynamic = "force-dynamic";

function KategoriChips({
  items,
  active,
}: {
  items: DocumentDoc[];
  active: string | null;
}) {
  const counts = new Map<string, number>();
  for (const d of items) {
    const k = d.kategori ?? "lainnya";
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  if (counts.size <= 1) return null;

  return (
    <>
      <a href="/dokumen" className={cn("tabs__item", !active && "is-active")}>
        Semua <span className="tabs__count">{items.length}</span>
      </a>
      {[...counts.entries()].map(([key, count]) => {
        const cfg = KATEGORI_DOC_CONFIG[key as DocKategori] ?? KATEGORI_DOC_CONFIG.lainnya;
        const isActive = active === key;
        return (
          <a key={key} href={`/dokumen?kategori=${key}`} className={cn("tabs__item", isActive && "is-active")}>
            {cfg.emoji} {cfg.label} <span className="tabs__count">{count}</span>
          </a>
        );
      })}
    </>
  );
}

function DocTypeTag({ mimeType }: { mimeType: string }) {
  let label = "FILE";
  let tone = "neutral";
  if (mimeType === "application/pdf") { label = "PDF"; tone = "neg"; }
  else if (mimeType.includes("wordprocessingml") || mimeType.includes("msword")) { label = "DOCX"; tone = "info"; }
  else if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) { label = "XLSX"; tone = "pos"; }
  else if (mimeType.startsWith("image/")) { label = "IMG"; tone = "warn"; }
  
  return <span className={`badge badge--${tone}`}><span className="badge__dot"></span>{label}</span>;
}

export default async function DokumenPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const params = await searchParams;
  const kategoriFilter = params.kategori ?? null;

  const db = await getDb();
  const all = (await db
    .collection("documents")
    .find({ org: "yrbb" })
    .sort({ created_at: -1 })
    .toArray()) as unknown as DocumentDoc[];

  const filteredDocs = kategoriFilter
    ? all.filter((d) => (d.kategori ?? "lainnya") === kategoriFilter)
    : all;
  const displayed = filteredDocs;

  // Group by kategori for stats
  const counts = { legal: 0, surat: 0, laporan: 0, laci: 0 };
  all.forEach(d => {
    const k = d.kategori as keyof typeof counts;
    if (counts.hasOwnProperty(k)) counts[k]++;
  });

  const totalSize = all.reduce((s, d) => s + (d.file_size ?? 0), 0);
  const formatBytes = (bytes: number) => (bytes / (1024 * 1024)).toFixed(1) + " MB";

  return (
    <main className="content" data-screen-label="06 Dokumen">
      <PageHeader 
        eyebrow="Arsip Yayasan"
        title="Dokumen Center"
        subtitle={`${filteredDocs.length} dokumen tersimpan · ${formatBytes(totalSize)} digunakan`}
      >
        <DocumentUploadButton />
      </PageHeader>

      {all.length > 0 && (
        <SummaryStrip variant="sewa">
          <SummaryCell 
            variant="sewa"
            label="Total Dokumen" 
            value={filteredDocs.length} 
            valueClassName="ss-cell__value--hero"
            subtext="File dalam arsip" 
          />
          <SummaryCell 
            variant="sewa"
            label="Legalitas & Akta" 
            value={counts.legal} 
            valueClassName="text-warn-700"
            subtext="Dokumen penting" 
          />
          <SummaryCell 
            variant="sewa"
            label="Surat & MoA" 
            value={counts.surat} 
            valueClassName="text-pos-700"
            subtext="Perjanjian kerjasama" 
          />
          <SummaryCell 
            variant="sewa"
            label="Laporan & Laci" 
            value={counts.laporan + counts.laci} 
            valueClassName="text-ink-000"
            subtext="Arsip pasif" 
          />
        </SummaryStrip>
      )}

      {all.length > 0 && (
        <div className="tabs" style={{ marginBottom: "var(--sp-8)" }}>
          <KategoriChips items={all} active={kategoriFilter} />
        </div>
      )}

      {displayed.length === 0 && (
        <div className="p-8 text-center text-ink-500" style={{ border: "var(--hair)", borderRadius: "var(--r-md)", background: "var(--surface)", marginTop: "var(--sp-8)" }}>
          <FolderOpen style={{ margin: "0 auto var(--sp-4)", color: "var(--ink-300)" }} />
          <div>Belum ada dokumen tersimpan.</div>
        </div>
      )}

      {displayed.length > 0 && (
        <section className="section">
          <table className="ledger">
            <thead>
              <tr>
                <th style={{ width: "300px" }}>Nama File</th>
                <th>Keterangan</th>
                <th style={{ width: "120px" }}>Tipe</th>
                <th className="num" style={{ width: "100px" }}>Ukuran</th>
                <th className="num" style={{ width: "120px" }}>Tanggal</th>
                <th style={{ width: "80px" }}></th>
              </tr>
            </thead>
            <tbody>
            {displayed.map((doc) => (
              <tr key={doc._id.toString()}>
                <td style={{ fontWeight: 600, color: "var(--ink-000)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {doc.judul}
                </td>
                <td style={{ color: "var(--ink-400)", fontSize: "var(--text-xs)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {doc.keterangan || "—"}
                </td>
                <td>
                  <DocTypeTag mimeType={doc.file_type} />
                </td>
                <td className="num" style={{ color: "var(--ink-400)" }}>
                  {formatFileSize(doc.file_size ?? 0)}
                </td>
                <td className="num" style={{ color: "var(--ink-400)" }}>
                  {formatDate(doc.created_at)}
                </td>
                <td style={{ textAlign: "right" }}>
                  <div style={{ display: "inline-flex", gap: "var(--sp-2)" }}>
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--ink-400)" }}><ExternalLink className="w-4 h-4" /></a>
                    <DocumentRowActions doc={doc} />
                  </div>
                </td>
              </tr>
            ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}
