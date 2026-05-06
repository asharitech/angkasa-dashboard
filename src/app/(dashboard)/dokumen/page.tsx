import { getDocumentsForOrg } from "@/lib/dal";
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
import {
  DashboardInteractiveRow,
  DashboardStatTile,
  DashboardStatTileGrid,
} from "@/components/layout/dashboard-surface";
import { PageToolbar } from "@/components/layout/page-toolbar";
import { EmptyState } from "@/components/empty-state";

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

  const all = await getDocumentsForOrg(ORG_ID) as DocumentDoc[];

  const displayed = kategoriFilter
    ? all.filter((d) => (d.kategori ?? "lainnya") === kategoriFilter)
    : all;

  const countByKat = new Map<string, number>();
  for (const d of all) {
    const k = d.kategori ?? "lainnya";
    countByKat.set(k, (countByKat.get(k) ?? 0) + 1);
  }

  const emptyTitle = kategoriFilter
    ? `Tidak ada dokumen kategori "${KATEGORI_DOC_CONFIG[kategoriFilter as DocKategori]?.label ?? kategoriFilter}"`
    : "Belum ada dokumen tersimpan";
  const emptyDescription = kategoriFilter
    ? undefined
    : "Upload dokumen yayasan dengan tombol di atas.";

  return (
    <DashboardPageShell>
      <PageHeader icon={FolderOpen} title="Dokumen Yayasan">
        <DocumentUploadButton />
      </PageHeader>

      {all.length > 0 && (
        <DashboardStatTileGrid>
          <DashboardStatTile value={all.length} label="Total dokumen" />
          <DashboardStatTile value={countByKat.size} label="Kategori" />
          <DashboardStatTile
            value={(all.reduce((s, d) => s + (d.file_size ?? 0), 0) / (1024 * 1024)).toFixed(1)}
            label="MB total"
          />
        </DashboardStatTileGrid>
      )}

      {all.length > 0 && (
        <PageToolbar>
          <KategoriChips
            items={all}
            getKey={(d) => (d.kategori ?? "lainnya") as string}
            configMap={KATEGORI_DOC_CONFIG as Record<string, { label: string; emoji: string; cls: string }>}
            activeKey={kategoriFilter}
            baseHref="/dokumen"
          />
        </PageToolbar>
      )}

      {displayed.length === 0 && (
        <EmptyState
          icon={FolderOpen}
          title={emptyTitle}
          description={emptyDescription}
          variant="dashed"
        />
      )}

      {displayed.length > 0 && (
        <div className="space-y-2">
          {displayed.map((doc) => {
            const kCfg = KATEGORI_DOC_CONFIG[doc.kategori ?? "lainnya"] ?? KATEGORI_DOC_CONFIG.lainnya;
            const IconComp = fileTypeIcon(doc.file_type);

            return (
              <DashboardInteractiveRow key={doc._id.toString()}>
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
              </DashboardInteractiveRow>
            );
          })}
        </div>
      )}
    </DashboardPageShell>
  );
}
