"use client"

import { useState, useMemo } from "react"
import { Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { DataTable, type DataTableColumn } from "@/components/data-table"
import { formatRupiah, formatRupiahCompact } from "@/lib/format"

export type EntryRow = {
  no: number
  keterangan: string
  masuk: number
  keluar: number
  saldo: number
}

const PAGE_SIZE = 18

type Direction = "all" | "in" | "out"

type Category = {
  label: string
  variant: "info" | "destructive" | "warning" | "default" | "secondary" | "success" | "outline"
}

function deriveCategory(keterangan: string): Category {
  const k = keterangan.toLowerCase()
  if (k.includes("sewa")) return { label: "Sewa", variant: "info" }
  if (k.includes("pinjam") || k.includes("loan")) return { label: "Pinjaman", variant: "warning" }
  if (k.includes("operasional") || k.includes("ops")) return { label: "Operasional", variant: "secondary" }
  if (k.includes("gaji") || k.includes("honor")) return { label: "Gaji", variant: "default" }
  if (k.includes("pajak")) return { label: "Pajak", variant: "destructive" }
  if (k.includes("transfer")) return { label: "Transfer", variant: "outline" }
  if (k.includes("masuk") || k.includes("terima")) return { label: "Masuk", variant: "success" }
  if (k.includes("keluar") || k.includes("bayar")) return { label: "Keluar", variant: "destructive" }
  return { label: "Lainnya", variant: "secondary" }
}

function MiniSparkline({ data }: { data: number[] }) {
  const width = 64
  const height = 20
  if (data.length < 2) return <span className="inline-block w-16" />

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pad = 2
  const innerW = width - pad * 2
  const innerH = height - pad * 2

  const points = data.map((v, i) => ({
    x: pad + (i / (data.length - 1)) * innerW,
    y: pad + (1 - (v - min) / range) * innerH,
  }))

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ")

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      aria-hidden="true"
      className="inline-block"
    >
      <polyline
        points={polyline}
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        className="text-muted-foreground"
      />
    </svg>
  )
}

export function EntriesTable({
  entries,
  initialPage = 1,
}: {
  entries: EntryRow[]
  initialPage?: number
}) {
  const [search, setSearch] = useState("")
  const [direction, setDirection] = useState<Direction>("all")
  const [page, setPage] = useState(initialPage)

  const filtered = useMemo(() => {
    let rows = entries
    if (search.trim()) {
      const q = search.toLowerCase()
      rows = rows.filter((r) => r.keterangan.toLowerCase().includes(q))
    }
    if (direction === "in") rows = rows.filter((r) => r.masuk > 0)
    if (direction === "out") rows = rows.filter((r) => r.keluar > 0)
    return rows
  }, [entries, search, direction])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const saldoAkhir = entries.length > 0 ? entries[entries.length - 1].saldo : 0

  // Precompute sparkline windows for current page rows — O(n) not O(n²)
  const sparklineMap = useMemo(() => {
    const map = new Map<number, number[]>()
    filtered.forEach((row, idx) => {
      const start = Math.max(0, idx - 4)
      map.set(row.no, filtered.slice(start, idx + 1).map((r) => r.saldo))
    })
    return map
  }, [filtered])

  const columns = useMemo<DataTableColumn<EntryRow>[]>(
    () => [
      {
        key: "no",
        header: "#",
        headerClassName: "w-10",
        className: "w-10 text-xs text-muted-foreground",
        cell: (row) => row.no,
      },
      {
        key: "keterangan",
        header: "Keterangan",
        nowrap: false,
        className: "max-w-[240px]",
        cell: (row) => (
          <span className="block truncate" title={row.keterangan}>
            {row.keterangan}
          </span>
        ),
      },
      {
        key: "kategori",
        header: "Kategori",
        cell: (row) => {
          const cat = deriveCategory(row.keterangan)
          return <Badge variant={cat.variant}>{cat.label}</Badge>
        },
      },
      {
        key: "masuk",
        header: "Masuk",
        align: "right",
        cell: (row) =>
          row.masuk > 0 ? (
            <span className="font-semibold text-success">{formatRupiah(row.masuk)}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        key: "keluar",
        header: "Keluar",
        align: "right",
        cell: (row) =>
          row.keluar > 0 ? (
            <span className="font-semibold text-destructive">{formatRupiah(row.keluar)}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        key: "saldo",
        header: "Saldo",
        align: "right",
        cell: (row) => <span className="font-bold">{formatRupiah(row.saldo)}</span>,
      },
      {
        key: "trend",
        header: "Trend",
        align: "right",
        headerClassName: "w-[72px]",
        className: "w-[72px]",
        cell: (row) => <MiniSparkline data={sparklineMap.get(row.no) ?? []} />,
      },
    ],
    [sparklineMap],
  )

  function handleDirectionChange(d: Direction) {
    setDirection(d)
    setPage(1)
  }

  function handleSearch(v: string) {
    setSearch(v)
    setPage(1)
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 px-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-1.5 text-sm font-semibold">
          <span>{filtered.length} transaksi</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-xs font-normal text-muted-foreground">
            Saldo akhir: {formatRupiahCompact(saldoAkhir)}
          </span>
        </div>

        <div className="flex items-center gap-2 sm:ml-auto">
          {/* Search */}
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari keterangan…"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="h-8 w-full rounded-md border border-border bg-background pl-7 pr-3 text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring/50 sm:w-44"
            />
          </div>

          {/* Direction tabs */}
          <div className="flex shrink-0 rounded-md border border-border text-xs">
            {(["all", "in", "out"] as Direction[]).map((d) => (
              <button
                key={d}
                onClick={() => handleDirectionChange(d)}
                className={`px-2.5 py-1 transition-colors first:rounded-l-[5px] last:rounded-r-[5px] ${
                  direction === d
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                {d === "all" ? "Semua" : d === "in" ? "Masuk" : "Keluar"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <DataTable<EntryRow>
        bleedMobile={false}
        compact
        minWidth={640}
        rows={pageRows}
        rowKey={(row) => String(row.no)}
        columns={columns}
        emptyRowsLabel="Tidak ada transaksi ditemukan."
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2 text-xs text-muted-foreground">
          <span>
            {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} dari{" "}
            {filtered.length}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="rounded border border-border px-2 py-1 disabled:opacity-40 hover:bg-muted"
            >
              ‹
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(safePage - 2, totalPages - 4))
              const pg = start + i
              return (
                <button
                  key={pg}
                  onClick={() => setPage(pg)}
                  className={`rounded border px-2 py-1 ${
                    pg === safePage
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  {pg}
                </button>
              )
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="rounded border border-border px-2 py-1 disabled:opacity-40 hover:bg-muted"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
