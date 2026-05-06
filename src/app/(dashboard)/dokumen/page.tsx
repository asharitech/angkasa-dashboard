import { getDb } from "@/lib/mongodb";
import { dbCollections } from "@/lib/db/collections";
import { requireDashboardSession } from "@/lib/dashboard-auth";
import { ORG_ID } from "@/lib/config";
import { PageHeader } from "@/components/page-header";
import {
  DocumentUploadButton,
  DocumentRowActions,
  KATEGORI_DOC_CONFIG,
  fileTypeIcon,
  formatFileSize,
  type DocumentDoc,
} from "@/components/document-manager";
import { KategoriChips } from "@/components/kategori-chips";
import type { DocKategori } from "@/lib/actions/documents";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import { FolderOpen, ExternalLink } from "lucide-react";
import { DashboardPageShell } from "@/components/layout/dashboard-page-shell";

export const dynamic = "force-dynamic";

function DocTypeTag({ mimeType }: { mimeType: string }) {
  if (mimeType === "application/pdf")
    return <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-destructive">PDF</span>;
  if (mimeType.includes("wordprocessingml") || mimeType.includes("msword"))
    return <span className="rounded bg-info/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-info">DOCX</span>;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel"))
    return <span className="rounded bg-success/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-success">XLSX</span>;
  if (mimeType.startsWith("image/"))
    return <span className="rounded bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-purple-600">IMG</span>;
  return <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">FILE</span>;
}

export default async function DokumenPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  await requireDashboardSession();

  const params = await searchParams;
  const kategoriFilter = params.kategori ?? null;

  const c = dbCollections(await getDb());
  const all = (await c.documents
    .find({ org: ORG_ID })
    .sort({ created_at: -1 })
    .toArray()) as unknown as DocumentDoc[];

  const displayed = kategoriFilter
    ? all.filter((d) => (d.kategori ?? "lainnya") === kategoriFilter)
    : all;

  const countByKat = new Map<string, number>();
  for (const d of all) {
    const k = d.kategori ?? "lainnya";
    countByKat.set(k, (countByKat.get(k) ?? 0) + 1);
  }

  return (
    <DashboardPageShell>
      <PageHeader icon={FolderOpen} title="Dokumen Yayasan">
        <DocumentUploadButton />
      </PageHeader>

      {all.length > 0 && (
        <div className="grid grid-cols-3 gap-2.5">
          <div className="rounded-xl border border-border/60 bg-card p-3 text-center shadow-sm">
            <p className="text-2xl font-bold tabular-nums">{all.length}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Total dokumen</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-card p-3 text-center shadow-sm">
            <p className="text-2xl font-bold tabular-nums">{countByKat.size}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Kategori</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-card p-3 text-center shadow-sm">
            <p className="text-2xl font-bold tabular-nums">
              {(all.reduce((s, d) => s + (d.file_size ?? 0), 0) / (1024 * 1024)).toFixed(1)}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">MB total</p>
          </div>
        </div>
      )}

      {all.length > 0 && (
        <KategoriChips
          items={all}
          getKey={(d) => (d.kategori ?? "lainnya") as string}
          configMap={KATEGORI_DOC_CONFIG as Record<string, { label: string; emoji: string; cls: string }>}
          activeKey={kategoriFilter}
          baseHref="/dokumen"
        />
      )}

      {displayed.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/60 py-16 text-center">
          <FolderOpen className="h-10 w-10 text-muted-foreground/20" />
          <div>
            <p className="text-sm font-semibold text-muted-foreground">
              {kategoriFilter
                ? `Tidak ada dokumen kategori "${KATEGORI_DOC_CONFIG[kategoriFilter as DocKategori]?.label ?? kategoriFilter}"`
                : "Belum ada dokumen tersimpan"}
            </p>
            {!kategoriFilter && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Upload dokumen yayasan dengan tombol di atas.
              </p>
            )}
          </div>
        </div>
      )}

      {displayed.length > 0 && (
        <div className="space-y-2">
          {displayed.map((doc) => {
            const kCfg = KATEGORI_DOC_CONFIG[doc.kategori ?? "lainnya"] ?? KATEGORI_DOC_CONFIG.lainnya;
            const IconComp = fileTypeIcon(doc.file_type);

            return (
              <div
                key={doc._id.toString()}
                className="group flex items-start gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm transition-all hover:shadow-md hover:border-border"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/60">
                  <IconComp className="h-5 w-5 text-muted-foreground" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="text-sm font-semibold leading-snug">{doc.judul}</p>
                    <DocTypeTag mimeType={doc.file_type} />
                  </div>

                  {doc.keterangan && (
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      {doc.keterangan}
                    </p>
                  )}

                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                        kCfg.cls,
                      )}
                    >
                      {kCfg.emoji} {kCfg.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(doc.file_size ?? 0)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(doc.created_at)}
                    </span>
                    <span className="truncate text-[11px] text-muted-foreground/60 max-w-[160px]">
                      {doc.file_name}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Buka / Unduh"
                    className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <DocumentRowActions doc={doc} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardPageShell>
  );
}
