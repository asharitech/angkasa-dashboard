"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText, Calendar, CheckCircle } from "lucide-react";
import { formatRupiah, formatDateShort } from "@/lib/format";
import { formatRequestorName, formatFundSource } from "@/lib/names";
import type { Obligation } from "@/lib/types";

interface DataExportProps {
  obligations: Obligation[];
  title?: string;
}

export function DataExport({ obligations, title = "Data Pengajuan" }: DataExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [lastExported, setLastExported] = useState<string | null>(null);

  const exportToCSV = (data: Obligation[], filename: string) => {
    const headers = [
      "ID",
      "Item",
      "Jumlah",
      "Requestor",
      "Kategori",
      "Status",
      "Sumber Dana",
      "Bulan",
      "Tanggal Dibuat",
      "Terakhir Update"
    ];

    const csvContent = [
      headers.join(","),
      ...data.map(ob => [
        ob._id,
        `"${ob.item?.replace(/"/g, '""') || ""}"`,
        ob.amount || 0,
        formatRequestorName(ob.requestor) || "",
        ob.category || "",
        ob.status || "",
        formatFundSource(ob.sumber_dana) || "",
        ob.month || "",
        ob.created_at ? formatDateShort(ob.created_at) : "",
        ob.updated_at ? formatDateShort(ob.updated_at) : ""
      ].join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = (data: Obligation[], filename: string) => {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateReport = (data: Obligation[]) => {
    const totalAmount = data.reduce((sum, ob) => sum + (ob.amount || 0), 0);
    const statusBreakdown = data.reduce((acc, ob) => {
      const status = ob.status || "unknown";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const categoryBreakdown = data.reduce((acc, ob) => {
      const category = ob.category || "unknown";
      acc[category] = {
        count: (acc[category]?.count || 0) + 1,
        amount: (acc[category]?.amount || 0) + (ob.amount || 0)
      };
      return acc;
    }, {} as Record<string, { count: number; amount: number }>);

    const requestorBreakdown = data.reduce((acc, ob) => {
      const requestor = ob.requestor || "unknown";
      acc[requestor] = {
        count: (acc[requestor]?.count || 0) + 1,
        amount: (acc[requestor]?.amount || 0) + (ob.amount || 0)
      };
      return acc;
    }, {} as Record<string, { count: number; amount: number }>);

    const reportContent = `
LAPORAN ${title.toUpperCase()}
${"=".repeat(50)}

RINGKASAN:
- Total Pengajuan: ${data.length} item
- Total Nilai: ${formatRupiah(totalAmount)}
- Tanggal Export: ${new Date().toLocaleString('id-ID')}

BREAKDOWN STATUS:
${Object.entries(statusBreakdown)
  .map(([status, count]) => `- ${status}: ${count} item`)
  .join("\n")}

BREAKDOWN KATEGORI:
${Object.entries(categoryBreakdown)
  .sort((a, b) => b[1].amount - a[1].amount)
  .map(([category, data]) =>
    `- ${category.replace(/_/g, " ")}: ${data.count} item (${formatRupiah(data.amount)})`
  )
  .join("\n")}

BREAKDOWN REQUESTOR:
${Object.entries(requestorBreakdown)
  .sort((a, b) => b[1].amount - a[1].amount)
  .map(([requestor, data]) =>
    `- ${formatRequestorName(requestor)}: ${data.count} item (${formatRupiah(data.amount)})`
  )
  .join("\n")}

DETAIL PENGAJUAN:
${"=".repeat(50)}
${data.map((ob, i) => `
${i + 1}. ${ob.item}
   Requestor: ${formatRequestorName(ob.requestor)}
   Kategori: ${ob.category?.replace(/_/g, " ")}
   Jumlah: ${formatRupiah(ob.amount || 0)}
   Status: ${ob.status}
   Sumber Dana: ${formatFundSource(ob.sumber_dana)}
   Bulan: ${ob.month}
`).join("\n")}
`;

    return reportContent;
  };

  const exportReport = (data: Obligation[], filename: string) => {
    const reportContent = generateReport(data);
    const blob = new Blob([reportContent], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = async (format: "csv" | "json" | "report") => {
    setIsExporting(true);

    try {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
      const baseFilename = `pengajuan-${timestamp}`;

      switch (format) {
        case "csv":
          exportToCSV(obligations, `${baseFilename}.csv`);
          break;
        case "json":
          exportToJSON(obligations, `${baseFilename}.json`);
          break;
        case "report":
          exportReport(obligations, `${baseFilename}-laporan.txt`);
          break;
      }

      setLastExported(new Date().toLocaleTimeString('id-ID'));
    } finally {
      setIsExporting(false);
    }
  };

  const totalAmount = obligations.reduce((sum, ob) => sum + (ob.amount || 0), 0);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Download className="h-5 w-5 text-muted-foreground" />
            Export Data
          </CardTitle>
          {lastExported && (
            <Badge variant="outline" className="text-green-700 border-green-300">
              <CheckCircle className="h-3 w-3 mr-1" />
              {lastExported}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Total Item</p>
            <p className="font-semibold">{obligations.length}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Total Nilai</p>
            <p className="font-semibold tabular-nums">{formatRupiah(totalAmount)}</p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            className="w-full inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            disabled={isExporting || obligations.length === 0}
          >
            {isExporting ? (
              "Mengexport..."
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download Data
              </>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuItem onClick={() => handleExport("csv")}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Excel/CSV Format
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("json")}>
              <FileText className="h-4 w-4 mr-2" />
              JSON Format
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleExport("report")}>
              <Calendar className="h-4 w-4 mr-2" />
              Laporan Lengkap
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <p className="text-xs text-muted-foreground text-center">
          Export akan mencakup {obligations.length} pengajuan yang sedang ditampilkan
        </p>
      </CardContent>
    </Card>
  );
}