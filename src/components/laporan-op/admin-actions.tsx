"use client"

import { useState, useTransition } from "react"
import { RefreshCw, Download, Pencil } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { refreshLaporanOpTotals } from "@/lib/actions/laporan-op"
import type { EntryRow } from "./entries-table"

function exportCsv(entries: EntryRow[], filename: string) {
  const header = "No,Keterangan,Masuk,Keluar,Saldo"
  const rows = entries.map((r) =>
    [r.no, `"${r.keterangan.replace(/"/g, '""')}"`, r.masuk, r.keluar, r.saldo].join(","),
  )
  const csv = [header, ...rows].join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function LaporanOpAdminActions({
  entries,
  period,
}: {
  entries: EntryRow[]
  period: string | null
}) {
  const [refreshPending, startRefresh] = useTransition()
  const [refreshMsg, setRefreshMsg] = useState<string | null>(null)

  function handleRefresh() {
    setRefreshMsg(null)
    startRefresh(async () => {
      const result = await refreshLaporanOpTotals()
      setRefreshMsg(result.error ?? "Totals diperbarui dari entries.")
      setTimeout(() => setRefreshMsg(null), 4000)
    })
  }

  function handleExport() {
    const filename = `laporan-op${period ? `-${period}` : ""}.csv`
    exportCsv(entries, filename)
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <button
          onClick={handleRefresh}
          disabled={refreshPending}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
        >
          <RefreshCw className={cn("h-3.5 w-3.5", refreshPending && "animate-spin")} />
          Refresh dari entries
        </button>
        <button
          onClick={handleExport}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </button>
        <button
          disabled
          title="Gunakan mongo_helper untuk edit snapshot"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5 cursor-not-allowed opacity-50")}
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit snapshot
        </button>
      </div>
      {refreshMsg && (
        <p className="text-xs text-muted-foreground">{refreshMsg}</p>
      )}
    </div>
  )
}
