"use client";

import { getObligations, validateObligationData } from "@/lib/data";
import { formatRupiah, formatDateShort } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { ObligationSearch } from "@/components/obligation-search";
import { DataExport } from "@/components/data-export";
import { Receipt, AlertTriangle, Calendar, DollarSign, User, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

  // Local filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [requestorFilter, setRequestorFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"cards" | "compact">("compact");

  useEffect(() => {
    async function loadData() {
      try {
        const [allObligations, report] = await Promise.all([
          fetch("/api/obligations").then(res => res.json()),
          fetch("/api/obligations/quality").then(res => res.json())
        ]);

        const pengajuanData = allObligations.filter((o: Obligation) => o.type === "pengajuan");
        setObligations(pengajuanData);
        setFilteredObligations(pengajuanData);
        setQualityReport(report);
      } catch (error) {
        console.error("Failed to load obligations:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Apply local filters
  useEffect(() => {
    let filtered = [...obligations];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(o =>
        o.item?.toLowerCase().includes(term) ||
        o.requestor?.toLowerCase().includes(term) ||
        o.category?.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(o => o.status === statusFilter);
    }

    if (requestorFilter !== "all") {
      filtered = filtered.filter(o => o.requestor === requestorFilter);
    }

    setFilteredObligations(filtered);
  }, [obligations, searchTerm, statusFilter, requestorFilter]);

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

  const pending = filteredObligations.filter(o => o.status === "pending");
  const resolved = filteredObligations.filter(o => o.status !== "pending");
  const pendingTotal = pending.reduce((s, o) => s + (o.amount ?? 0), 0);

  // Get unique requestors for filter
  const uniqueRequestors = Array.from(new Set(obligations.map(o => o.requestor).filter(Boolean))) as string[];

  // Summary stats per requestor
  const requestorStats = uniqueRequestors.map(requestor => {
    const items = pending.filter(o => o.requestor === requestor);
    const total = items.reduce((s, o) => s + (o.amount ?? 0), 0);
    return { requestor, count: items.length, total };
  }).sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader icon={Receipt} title="Pengajuan">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-amber-50 text-amber-700 border-amber-200 font-semibold px-3 py-1.5">
            {pending.length} pending · {formatRupiah(pendingTotal)}
          </Badge>
          {resolved.length > 0 && (
            <Badge className="bg-green-50 text-green-700 border-green-200 font-semibold px-3 py-1.5">
              {resolved.length} selesai
            </Badge>
          )}
          {qualityReport && qualityReport.duplicateCount > 0 && (
            <Badge className="bg-red-50 text-red-700 border-red-200 font-semibold px-3 py-1.5">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {qualityReport.duplicateCount} duplikasi
            </Badge>
          )}
        </div>
      </PageHeader>

      {/* Summary Cards */}
      {requestorStats.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {requestorStats.map(({ requestor, count, total }) => (
            <Card
              key={requestor}
              className={`cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] ${
                requestorFilter === requestor
                  ? 'ring-2 ring-blue-500 bg-blue-50'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => setRequestorFilter(requestorFilter === requestor ? "all" : requestor)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-blue-100 rounded-lg">
                    <User className="h-3 w-3 text-blue-600" />
                  </div>
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    {requestor}
                  </span>
                </div>
                <p className="text-lg font-bold text-gray-900 tabular-nums mb-1">
                  {formatRupiah(total)}
                </p>
                <div className="flex items-center gap-1">
                  <FileText className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    {count} item{count > 1 ? 's' : ''}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <Card className="border-gray-200">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[250px]">
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search items, requestors, categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value || "all")}>
                <SelectTrigger className="w-[130px] h-10 border-gray-300">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="lunas">Complete</SelectItem>
                </SelectContent>
              </Select>

              <Select value={requestorFilter} onValueChange={(value) => setRequestorFilter(value || "all")}>
                <SelectTrigger className="w-[150px] h-10 border-gray-300">
                  <SelectValue placeholder="Requestor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Requestors</SelectItem>
                  {uniqueRequestors.map(requestor => (
                    <SelectItem key={requestor} value={requestor}>
                      {requestor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    viewMode === 'compact'
                      ? 'bg-white shadow-sm text-gray-900'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  onClick={() => setViewMode('compact')}
                >
                  Table
                </button>
                <button
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    viewMode === 'cards'
                      ? 'bg-white shadow-sm text-gray-900'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  onClick={() => setViewMode('cards')}
                >
                  Cards
                </button>
              </div>
            </div>
          </div>

          {/* Active filters display */}
          {(searchTerm || statusFilter !== 'all' || requestorFilter !== 'all') && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
              <span className="text-xs text-gray-500 font-medium">Active filters:</span>
              {searchTerm && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                  Search: "{searchTerm}"
                  <button onClick={() => setSearchTerm('')} className="ml-1 text-blue-600 hover:text-blue-800">×</button>
                </span>
              )}
              {statusFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                  Status: {statusFilter}
                  <button onClick={() => setStatusFilter('all')} className="ml-1 text-blue-600 hover:text-blue-800">×</button>
                </span>
              )}
              {requestorFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                  Requestor: {requestorFilter}
                  <button onClick={() => setRequestorFilter('all')} className="ml-1 text-blue-600 hover:text-blue-800">×</button>
                </span>
              )}
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setRequestorFilter('all');
                }}
                className="text-xs text-gray-500 hover:text-gray-700 font-medium"
              >
                Clear all
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Quality Warning */}
      {qualityReport && (qualityReport.duplicateCount > 0 || qualityReport.missingFieldCount > 0) && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-amber-800">Data Quality Issues</h3>
                <div className="mt-2 space-y-1 text-xs text-amber-700">
                  {qualityReport.duplicateCount > 0 && (
                    <p>• {qualityReport.duplicateCount} duplicate submissions detected</p>
                  )}
                  {qualityReport.missingFieldCount > 0 && (
                    <p>• {qualityReport.missingFieldCount} incomplete records found</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className="space-y-6">
        {/* Table Header Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {filteredObligations.length} {filteredObligations.length === 1 ? 'submission' : 'submissions'}
            </h2>
            {(searchTerm || statusFilter !== 'all' || requestorFilter !== 'all') && (
              <span className="text-sm text-muted-foreground">
                ({obligations.length} total)
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <DataExport obligations={filteredObligations} />
          </div>
        </div>

        {/* Main Data Display */}
        {filteredObligations.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
              <h3 className="text-xl font-semibold mb-3 text-gray-900">No submissions found</h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm || statusFilter !== "all" || requestorFilter !== "all"
                  ? "No submissions match your current filters. Try adjusting your search criteria."
                  : "No submissions have been created yet."}
              </p>
              {(searchTerm || statusFilter !== "all" || requestorFilter !== "all") && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setRequestorFilter('all');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </CardContent>
          </Card>
        ) : viewMode === 'compact' ? (
          <CompactList items={filteredObligations} />
        ) : (
          <div className="space-y-4">
            {filteredObligations.map(item => (
              <EnhancedPengajuanCard key={item._id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Modern table view with clean design
function CompactList({ items }: { items: Obligation[] }) {
  return (
    <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b bg-gray-50/80">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Item
              </th>
              <th className="text-left px-3 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Requestor
              </th>
              <th className="text-center px-3 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Status
              </th>
              <th className="text-left px-3 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Source
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item, index) => (
              <tr
                key={item._id}
                className={`hover:bg-blue-50/50 transition-colors ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                }`}
              >
                <td className="px-4 py-4">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 leading-snug">{item.item}</p>
                    {item.date_spent && (
                      <div className="flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {formatDateShort(item.date_spent)}
                        </span>
                      </div>
                    )}
                    {item.category && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 mt-1">
                        {item.category.replace(/_/g, " ")}
                      </span>
                    )}
                  </div>
                </td>

                <td className="px-3 py-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-blue-100 rounded">
                      <User className="h-3 w-3 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {item.requestor}
                    </span>
                  </div>
                </td>

                <td className="px-3 py-4 text-center">
                  <StatusBadge status={item.status} size="sm" />
                </td>

                <td className="px-3 py-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-3 w-3 text-green-600" />
                    <span className="text-sm text-gray-600">
                      {item.sumber_dana?.replace(/_/g, " ") || "-"}
                    </span>
                  </div>
                </td>

                <td className="px-4 py-4 text-right">
                  <span className="text-sm font-bold text-gray-900 tabular-nums">
                    {item.amount ? formatRupiah(item.amount) : "-"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {items.length === 0 && (
        <div className="text-center py-8">
          <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No items found</p>
        </div>
      )}
    </div>
  );
}

// Enhanced card view for detailed information
function EnhancedPengajuanCard({ item }: { item: Obligation }) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold leading-tight">{item.item}</h3>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  {item.requestor && (
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{item.requestor}</span>
                    </div>
                  )}
                  {item.date_spent && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDateShort(item.date_spent)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={item.status} />
              <Badge variant="outline" className="text-xs">
                {item.category?.replace(/_/g, " ")}
              </Badge>
              {item.sumber_dana && (
                <Badge variant="outline" className="text-xs">
                  <DollarSign className="h-3 w-3 mr-1" />
                  {item.sumber_dana.replace(/_/g, " ")}
                </Badge>
              )}
            </div>

            {item.detail && item.detail.length > 0 && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                  Breakdown
                </h4>
                <div className="space-y-1.5">
                  {item.detail.map((d, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{d.item}</span>
                      <span className="font-medium tabular-nums">{formatRupiah(d.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="text-right shrink-0">
            <span className="text-xl font-bold tabular-nums">
              {item.amount ? formatRupiah(item.amount) : "-"}
            </span>
            {item.month && (
              <p className="text-xs text-muted-foreground mt-1">
                {monthLabel(item.month)}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
