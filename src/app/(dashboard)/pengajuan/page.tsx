import { getObligations, validateObligationData } from "@/lib/data";
import { formatRupiah, formatDateShort } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { ObligationSearch } from "@/components/obligation-search";
import { DataExport } from "@/components/data-export";
import { Receipt, AlertTriangle } from "lucide-react";

"use client";

import { useState, useEffect } from "react";
import { Obligation } from "@/lib/types";

const MONTH_LABELS: Record<string, string> = {
  "2026-03": "Maret",
  "2026-04": "April",
  "2026-05": "Mei",
  "2026-06": "Juni",
};

function monthLabel(m: string) {
  return MONTH_LABELS[m] ?? m;
}

export default function PengajuanPage() {
  const [obligations, setObligations] = useState<Obligation[]>([]);
  const [filteredObligations, setFilteredObligations] = useState<Obligation[]>([]);
  const [qualityReport, setQualityReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [allObligations, report] = await Promise.all([
          fetch("/api/obligations").then(res => res.json()),
          fetch("/api/obligations/quality").then(res => res.json())
        ]);

        setObligations(allObligations.filter((o: Obligation) => o.type === "pengajuan"));
        setFilteredObligations(allObligations.filter((o: Obligation) => o.type === "pengajuan"));
        setQualityReport(report);
      } catch (error) {
        console.error("Failed to load obligations:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader icon={Receipt} title="Pengajuan">
          <Badge className="bg-gray-100 text-gray-600 animate-pulse">
            Loading...
          </Badge>
        </PageHeader>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="h-32 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  const pending = filteredObligations.filter((o) => o.status === "pending");
  const resolved = filteredObligations.filter((o) => o.status !== "pending");

  // Group by month → requestor
  const months = Array.from(new Set(pending.map((o) => o.month ?? "").filter(Boolean))).sort();

  const pendingTotal = pending.reduce((s, o) => s + (o.amount ?? 0), 0);

  // Summary per requestor across all months
  const byRequestor = new Map<string, typeof pending>();
  for (const item of pending) {
    const key = item.requestor ?? "unknown";
    if (!byRequestor.has(key)) byRequestor.set(key, []);
    byRequestor.get(key)!.push(item);
  }

  // Extract duplicate amounts for warning
  const duplicateAmounts = qualityReport?.duplicateObligations?.map((dup: any) => dup.amount) || [];

  return (
    <div className="space-y-6">
      <PageHeader icon={Receipt} title="Pengajuan">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-amber-50 text-amber-700 border-amber-200 font-semibold px-3 py-1.5">
            {pending.length} belum lunas · {formatRupiah(pendingTotal)}
          </Badge>
          {qualityReport && qualityReport.duplicateCount > 0 && (
            <Badge className="bg-red-50 text-red-700 border-red-200 font-semibold px-3 py-1.5">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {qualityReport.duplicateCount} duplikasi
            </Badge>
          )}
        </div>
      </PageHeader>

      {/* Search and Filter */}
      <ObligationSearch
        obligations={obligations}
        onFilteredChange={setFilteredObligations}
        duplicateAmounts={duplicateAmounts}
      />

      {/* Data Quality Report */}
      {qualityReport && (qualityReport.duplicateCount > 0 || qualityReport.missingFieldCount > 0) && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-amber-800">Masalah Kualitas Data</h3>
                <div className="mt-2 space-y-1 text-xs text-amber-700">
                  {qualityReport.duplicateCount > 0 && (
                    <p>• {qualityReport.duplicateCount} pengajuan duplikasi ditemukan</p>
                  )}
                  {qualityReport.missingFieldCount > 0 && (
                    <p>• {qualityReport.missingFieldCount} field kosong ditemukan</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Requestor summary */}
          {byRequestor.size > 0 && (
            <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3">
              {Array.from(byRequestor.entries()).map(([requestor, items]) => {
                const subtotal = items.reduce((s, o) => s + (o.amount ?? 0), 0);
                return (
                  <div key={requestor} className="rounded-xl bg-amber-50/50 px-4 py-3">
                    <p className="text-xs text-muted-foreground">{requestor}</p>
                    <p className="text-base font-bold tabular-nums mt-0.5">{formatRupiah(subtotal)}</p>
                    <p className="text-xs text-muted-foreground">{items.length} item</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Main Tabs Content */}
          <Tabs defaultValue="pending">
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="pending" className="flex-1 md:flex-initial">
            Belum Lunas ({pending.length})
          </TabsTrigger>
          <TabsTrigger value="resolved" className="flex-1 md:flex-initial">
            Selesai ({resolved.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {months.length > 1 ? (
            /* Multiple months — show inner tabs */
            <Tabs defaultValue={months[months.length - 1]}>
              <TabsList className="w-full mb-4">
                {months.map((m) => {
                  const items = pending.filter((o) => (o.month ?? "") === m);
                  const total = items.reduce((s, o) => s + (o.amount ?? 0), 0);
                  return (
                    <TabsTrigger key={m} value={m} className="flex-1 text-sm">
                      {monthLabel(m)}{" "}
                      <span className="ml-1 text-xs text-muted-foreground">
                        {formatRupiah(total)}
                      </span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {months.map((m) => {
                const monthItems = pending.filter((o) => (o.month ?? "") === m);
                // Group by requestor within this month
                const monthByRequestor = new Map<string, typeof monthItems>();
                for (const item of monthItems) {
                  const key = item.requestor ?? "unknown";
                  if (!monthByRequestor.has(key)) monthByRequestor.set(key, []);
                  monthByRequestor.get(key)!.push(item);
                }
                return (
                  <TabsContent key={m} value={m} className="space-y-4">
                    {Array.from(monthByRequestor.entries()).map(([requestor, items]) => {
                      const subtotal = items.reduce((s, o) => s + (o.amount ?? 0), 0);
                      return (
                        <div key={requestor} className="space-y-2">
                          <div className="flex items-center justify-between px-1">
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                              {requestor}
                            </h3>
                            <span className="text-sm font-semibold text-muted-foreground tabular-nums">
                              {items.length} item · {formatRupiah(subtotal)}
                            </span>
                          </div>
                          {items.map((item) => (
                            <PengajuanCard key={item._id} item={item} />
                          ))}
                        </div>
                      );
                    })}
                  </TabsContent>
                );
              })}
            </Tabs>
          ) : (
            /* Single month or no month — flat list by requestor */
            <div className="space-y-4">
              {Array.from(byRequestor.entries()).map(([requestor, items]) => {
                const subtotal = items.reduce((s, o) => s + (o.amount ?? 0), 0);
                return (
                  <div key={requestor} className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        {requestor}
                      </h3>
                      <span className="text-sm font-semibold text-muted-foreground tabular-nums">
                        {items.length} item · {formatRupiah(subtotal)}
                      </span>
                    </div>
                    {items.map((item) => (
                      <PengajuanCard key={item._id} item={item} />
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="resolved" className="mt-4 space-y-2">
          {resolved.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Belum ada yang selesai.
            </p>
          ) : (
            resolved.map((item) => (
              <PengajuanCard key={item._id} item={item} />
            ))
          )}
        </TabsContent>
          </Tabs>
        </div>

        <div>
          <DataExport obligations={filteredObligations} />
        </div>
      </div>
    </div>
  );
}

function PengajuanCard({
  item,
}: {
  item: {
    _id: string;
    item: string;
    amount: number | null;
    month?: string | null;
    category: string;
    sumber_dana?: string | null;
    status: string;
    detail?: { item: string; amount: number }[] | null;
    date_spent?: string | null;
  };
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-snug">{item.item}</p>
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              <StatusBadge status={item.status} />
              <Badge variant="outline">
                {item.category.replace(/_/g, " ")}
              </Badge>
              {item.sumber_dana && (
                <Badge variant="outline">
                  {item.sumber_dana.replace(/_/g, " ")}
                </Badge>
              )}
            </div>
            {item.date_spent && (
              <p className="text-xs text-muted-foreground mt-1.5">
                📅 {formatDateShort(item.date_spent)}
              </p>
            )}
          </div>
          <span className="text-base font-bold tabular-nums shrink-0">
            {item.amount ? formatRupiah(item.amount) : "-"}
          </span>
        </div>

        {item.detail && item.detail.length > 0 && (
          <div className="rounded-lg bg-muted/50 p-3 space-y-1.5">
            {item.detail.map((d, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{d.item}</span>
                <span className="tabular-nums font-medium">{formatRupiah(d.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
