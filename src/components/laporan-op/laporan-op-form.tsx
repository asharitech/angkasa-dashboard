"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateLaporanOpAction } from "@/lib/actions/laporan-op"
import { Loader2, Plus, Trash2 } from "lucide-react"

interface LaporanOpFormProps {
  ledger: any
  onSuccess: () => void
  onCancel: () => void
}

export function LaporanOpForm({ ledger, onSuccess, onCancel }: LaporanOpFormProps) {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Meta fields
  const [period, setPeriod] = useState(ledger.period)
  const [periodCode, setPeriodCode] = useState(ledger.period_code || "")
  const [asOf, setAsOf] = useState(ledger.as_of ? new Date(ledger.as_of).toISOString().slice(0, 10) : "")
  const [isCurrent, setIsCurrent] = useState(ledger.is_current)

  // Totals
  const [masuk, setMasuk] = useState(ledger.laporan_op?.totals?.masuk || 0)
  const [keluar, setKeluar] = useState(ledger.laporan_op?.totals?.keluar || 0)
  const [saldo, setSaldo] = useState(ledger.laporan_op?.totals?.saldo || 0)
  const [danaEfektif, setDanaEfektif] = useState(ledger.laporan_op?.dana_efektif || 0)

  // Kewajiban
  const initialKewajiban = Object.entries(ledger.laporan_op?.kewajiban || {})
    .filter(([k, v]) => k !== "total" && typeof v === "number")
    .map(([key, amount]) => ({ key, amount: amount as number }))
  
  const [kewajibanList, setKewajibanList] = useState(initialKewajiban)

  const addKewajiban = () => {
    setKewajibanList([...kewajibanList, { key: "baru", amount: 0 }])
  }

  const removeKewajiban = (index: number) => {
    setKewajibanList(kewajibanList.filter((_, i) => i !== index))
  }

  const updateKewajiban = (index: number, patch: any) => {
    const next = [...kewajibanList]
    next[index] = { ...next[index], ...patch }
    setKewajibanList(next)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const kewajibanObj: any = {}
    let totalKewajiban = 0
    kewajibanList.forEach((item) => {
      if (item.key.trim()) {
        kewajibanObj[item.key.trim()] = item.amount
        totalKewajiban += item.amount
      }
    })
    kewajibanObj.total = totalKewajiban

    start(async () => {
      const result = await updateLaporanOpAction(ledger._id, {
        period,
        period_code: periodCode || null,
        as_of: asOf,
        is_current: isCurrent,
        laporan_op: {
          dana_efektif: danaEfektif,
          totals: { masuk, keluar, saldo },
          kewajiban: {
            total: totalKewajiban,
            fields: kewajibanObj
          }
        }
      })
      
      // Note: Our action used 'list' in the interface but the schema uses fields. 
      // I should align the action to use the object approach or handle both.
      // Actually let's fix the action to be more robust.
      
      if (result.error) {
        setError(result.error)
      } else {
        onSuccess()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="period">Periode (Display)</Label>
          <Input id="period" value={period} onChange={(e) => setPeriod(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="periodCode">Kode Periode (YYYY-MM)</Label>
          <Input id="periodCode" value={periodCode} onChange={(e) => setPeriodCode(e.target.value)} placeholder="2026-05" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="asOf">Snapshot Per Tanggal</Label>
          <Input id="asOf" type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)} />
        </div>
        <div className="flex items-center gap-2 pt-8">
          <input 
            id="isCurrent" 
            type="checkbox" 
            checked={isCurrent} 
            onChange={(e) => setIsCurrent(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <Label htmlFor="isCurrent">Set sebagai Periode Aktif</Label>
        </div>
      </div>

      <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Arus Kas (Snapshot Totals)</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="masuk">Total Masuk</Label>
            <Input id="masuk" type="number" value={masuk} onChange={(e) => setMasuk(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="keluar">Total Keluar</Label>
            <Input id="keluar" type="number" value={keluar} onChange={(e) => setKeluar(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="saldo">Saldo (Masuk - Keluar)</Label>
            <Input id="saldo" type="number" value={saldo} onChange={(e) => setSaldo(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="danaEfektif">Dana Efektif (Saldo - Kewajiban)</Label>
            <Input id="danaEfektif" type="number" value={danaEfektif} onChange={(e) => setDanaEfektif(Number(e.target.value))} />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Kewajiban Breakdown</h3>
          <Button type="button" variant="outline" size="sm" onClick={addKewajiban} className="h-7 gap-1">
            <Plus className="h-3 w-3" /> Tambah
          </Button>
        </div>
        
        <div className="space-y-2">
          {kewajibanList.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input 
                value={item.key} 
                onChange={(e) => updateKewajiban(i, { key: e.target.value })} 
                placeholder="key_db"
                className="flex-1"
              />
              <Input 
                type="number"
                value={item.amount} 
                onChange={(e) => updateKewajiban(i, { amount: Number(e.target.value) })} 
                className="w-32 tabular-nums"
              />
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                onClick={() => removeKewajiban(i)}
                className="h-9 w-9 text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {kewajibanList.length === 0 && (
            <p className="text-center py-4 text-xs text-muted-foreground italic">Klik tambah untuk memasukkan kewajiban.</p>
          )}
        </div>
      </div>

      {error && <p className="text-sm font-medium text-destructive">{error}</p>}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>
          Batal
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Simpan Perubahan
        </Button>
      </div>
    </form>
  )
}
