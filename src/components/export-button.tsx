"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExportButton({
  data,
  filename,
  label = "Export",
  className,
}: {
  data: Record<string, unknown>[];
  filename: string;
  label?: string;
  className?: string;
}) {
  const handleExport = () => {
    if (!data || data.length === 0) {
      alert("Tidak ada data untuk di-export");
      return;
    }

    // Convert data to CSV
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            let val = row[header];
            if (val === null || val === undefined) val = "";
            else if (typeof val === "object") val = JSON.stringify(val);
            // Escape quotes and wrap in quotes if there's a comma
            const strVal = String(val).replace(/"/g, '""');
            return `"${strVal}"`;
          })
          .join(",")
      ),
    ].join("\n");

    // Create a blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Button variant="outline" className={className || "btn btn--secondary"} onClick={handleExport}>
      <Download className="btn__icon w-4 h-4 mr-2" /> {label}
    </Button>
  );
}
