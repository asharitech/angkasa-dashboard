import type { Ledger } from "@/lib/types";
import { getCollections } from "./context";
import { serializeDates } from "./serialize";

export async function getLedger(type: string, current = true): Promise<Ledger | null> {
  const c = await getCollections();
  return c.ledgers.findOne({
    type,
    is_current: current,
  });
}

export async function getLedgerByCode(type: string, period_code: string): Promise<Ledger | null> {
  const c = await getCollections();
  const byCode = await c.ledgers.findOne({ type, period_code });
  if (byCode) return byCode;
  return c.ledgers.findOne({
    type,
    $expr: { $eq: [{ $dateToString: { format: "%Y-%m", date: "$as_of" } }, period_code] },
  });
}

export async function getAllLedgers(): Promise<Ledger[]> {
  const c = await getCollections();
  return c.ledgers.find({ is_current: true }).toArray();
}

export async function getSewaHistory(): Promise<Ledger[]> {
  const c = await getCollections();
  return c.ledgers.find({ type: "sewa" }).sort({ updated_at: -1 }).toArray();
}

export async function getDashboardTrend(): Promise<{ month: string; net: number }[]> {
  const c = await getCollections();
  const docs = await c.ledgers.find({ type: "laporan_op" }).sort({ period: -1 }).limit(13).toArray();
  const result = docs
    .filter((doc) => doc.period != null && doc.laporan_op?.dana_efektif != null)
    .map((doc) => {
      const month = doc.period_code ?? (doc.as_of ? String(doc.as_of).substring(0, 7) : null) ?? doc.period;
      return { month: month as string, net: doc.laporan_op!.dana_efektif as number };
    });
  result.sort((a, b) => a.month.localeCompare(b.month));
  return result;
}

export async function getLaporanOpPeriods(): Promise<{ period: string; is_current: boolean }[]> {
  const c = await getCollections();
  const docs = await c.ledgers
    .find({ type: "laporan_op" })
    .sort({ period: -1 })
    .limit(13)
    .project({ period: 1, period_code: 1, as_of: 1, is_current: 1 })
    .toArray();
  return docs.map((d) => {
    const code = d.period_code ?? (d.as_of ? new Date(d.as_of as string).toISOString().substring(0, 7) : null) ?? d.period;
    return { period: code as string, is_current: d.is_current ?? false };
  });
}

export async function getLaporanOpMonthlyFlow(): Promise<{ month: string; masuk: number; keluar: number }[]> {
  const c = await getCollections();
  const docs = await c.ledgers.find({ type: "laporan_op" }).sort({ period: -1 }).limit(6).toArray();
  return serializeDates(
    docs
      .filter((d) => d.period != null && d.laporan_op?.totals != null)
      .map((d) => {
        const month = d.period_code ?? (d.as_of ? new Date(d.as_of as string).toISOString().substring(0, 7) : null) ?? d.period;
        return { month: month as string, masuk: d.laporan_op!.totals.masuk, keluar: d.laporan_op!.totals.keluar };
      })
      .sort((a, b) => a.month.localeCompare(b.month)),
  );
}
