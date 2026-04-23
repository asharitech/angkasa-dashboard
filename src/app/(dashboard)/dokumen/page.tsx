import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
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

  const displayed = kategoriFilter
    ? all.filter((d) => (d.kategori ?? "lainnya") === kategoriFilter)
    : all;

  // Group by kategori for stats
  const countByKat = new Map<string, number>();
  for (const d of all) {
    const k = d.kategori ?? "lainnya";
    countByKat.set(k, (countByKat.get(k) ?? 0) + 1);
  }

  return (
    <main className="content" data-screen-label="06 Dokumen">
      <div className="page-head">
        <div>
          <div className="t-eyebrow" style={{ marginBottom: "var(--sp-2)" }}>Yayasan YRBB · Arsip</div>
          <h1 className="page-head__title">Dokumen Yayasan</h1>
          <div className="page-head__sub">File pendukung operasional dan legalitas</div>
        </div>
        <div className="page-head__actions">
          <DocumentUploadButton />
        </div>
      </div>

      {all.length > 0 && (
        <div className="sewa-summary">
          <div className="ss-cell">
            <div className="ss-cell__label">Total Dokumen</div>
            <div className="ss-cell__value ss-cell__value--hero">{all.length}</div>
          </div>
          <div className="ss-cell">
            <div className="ss-cell__label">Kategori Aktif</div>
            <div className="ss-cell__value" style={{ color: "var(--pos-700)" }}>{countByKat.size}</div>
          </div>
          <div className="ss-cell">
            <div className="ss-cell__label">Penyimpanan Terpakai</div>
            <div className="ss-cell__value">{(all.reduce((s, d) => s + (d.file_size ?? 0), 0) / (1024 * 1024)).toFixed(1)} <span style={{ fontSize: "var(--text-sm)" }}>MB</span></div>
          </div>
        </div>
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
