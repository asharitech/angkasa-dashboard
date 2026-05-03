import { getDb } from "./mongodb";
import { dbCollections } from "./db/collections";
import { ACCOUNTS, ORG_ID } from "./config";
import type { DbDate, EntryDirection, EntryFields, ObligationDoc, PemantauanDoc } from "./db/schema";
import type { Account, Obligation, Ledger, Entry, ActivityEvent, Numpang, DataIntegrityIssue } from "./types";
import type { Filter } from "mongodb";
import { ObjectId } from "mongodb";

export async function getPemantauan(): Promise<PemantauanDoc[]> {
  const c = dbCollections(await getDb());
  return c.pemantauan.find().sort({ holder: 1, lokasi_code: 1 }).toArray();
}

export async function getNumpang(): Promise<Numpang[]> {
  const c = dbCollections(await getDb());
  return c.numpang.find({}).sort({ amount: -1 }).toArray();
}

export async function getNumpangActive(): Promise<Numpang[]> {
  const c = dbCollections(await getDb());
  return c.numpang.find({ status: "active" }).sort({ amount: -1 }).toArray();
}

export async function computeBriKas(): Promise<{ briBalance: number; numpangTotal: number; briKas: number }> {
  const c = dbCollections(await getDb());
  const [bri, numpang] = await Promise.all([
    c.accounts.findOne({ _id: ACCOUNTS.personalBri }),
    getNumpangActive(),
  ]);
  const briBalance = bri?.balance ?? 0;
  const numpangTotal = numpang.reduce((s, n) => s + n.amount, 0);
  return { briBalance, numpangTotal, briKas: briBalance - numpangTotal };
}

export async function getAccounts(): Promise<Account[]> {
  const c = dbCollections(await getDb());
  return c.accounts.find().toArray();
}

export async function getLedger(type: string, current = true): Promise<Ledger | null> {
  const c = dbCollections(await getDb());
  return c.ledgers.findOne({
    type,
    is_current: current,
  });
}

export async function getLedgerByCode(type: string, period_code: string): Promise<Ledger | null> {
  const c = dbCollections(await getDb());
  // Try exact period_code match first; fall back to as_of prefix match (for docs without period_code)
  const byCode = await c.ledgers.findOne({ type, period_code });
  if (byCode) return byCode;
  // as_of is stored as ISO string or Date; match YYYY-MM prefix
  return c.ledgers.findOne({
    type,
    $expr: { $eq: [{ $dateToString: { format: "%Y-%m", date: "$as_of" } }, period_code] },
  });
}

export async function getAllLedgers(): Promise<Ledger[]> {
  const c = dbCollections(await getDb());
  return c.ledgers.find({ is_current: true }).toArray();
}

export async function getObligations(filter: Filter<ObligationDoc> = {}): Promise<Obligation[]> {
  const c = dbCollections(await getDb());
  return c.obligations.find(filter).sort({ month: 1, created_at: -1 }).toArray();
}

export async function getObligationById(id: string): Promise<Obligation | null> {
  const c = dbCollections(await getDb());
  return c.obligations.findOne({ _id: new ObjectId(id) });
}

export async function getEntries(filter: Filter<EntryFields> = {}, limit = 50): Promise<Entry[]> {
  const c = dbCollections(await getDb());
  return c.entries.find(filter).sort({ date: -1 }).limit(limit).toArray();
}

export async function deleteEntry(id: string): Promise<void> {
  const c = dbCollections(await getDb());
  await c.entries.deleteOne({ _id: new ObjectId(id) });
}

function dbDateToDateOnlyString(d: DbDate | undefined | null): string | undefined {
  if (d == null) return undefined;
  if (typeof d === "string") return d;
  return d.toISOString().slice(0, 10);
}

// Serialize any Date objects in a plain object to ISO date strings (YYYY-MM-DD).
// Applied before returning data that will be passed to React components to prevent
// "Objects with toJSON are not supported" errors from Next.js serialization.
function serializeDates<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return obj.toISOString().slice(0, 10) as unknown as T;
  if (obj instanceof ObjectId) return obj.toString() as unknown as T;
  if (Array.isArray(obj)) return obj.map(serializeDates) as unknown as T;
  if (typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = serializeDates(value);
    }
    return result as T;
  }
  return obj;
}

export async function getPribadiSummary() {
  const c = dbCollections(await getDb());

  const [accounts, entries, savings, loans, recurring, piutangByMonth, savingsTotal, numpang] =
    await Promise.all([
      getAccounts(),
      getEntries({ owner: "angkasa", domain: { $ne: "yayasan" } }, 50),
      getEntries({ category: "savings" }, 50),
      getObligations({ type: "loan", status: "active" }),
      getObligations({ type: "recurring", status: "active" }),
      c.obligations.aggregate([
        { $match: { type: "pengajuan", status: "pending", sumber_dana: "BRI_ANGKASA" } },
        { $group: { _id: "$month", count: { $sum: 1 }, total: { $sum: "$amount" } } },
        { $sort: { _id: 1 } },
      ]).toArray(),
      c.entries.aggregate([
        { $match: { category: "savings" } },
        { $group: {
            _id: "$owner",
            count: { $sum: 1 },
            total: { $sum: "$amount" },
            total_in: { $sum: { $cond: [{ $eq: ["$direction", "in"] }, "$amount", 0] } },
            total_out: { $sum: { $cond: [{ $eq: ["$direction", "out"] }, "$amount", 0] } },
          } },
      ]).toArray(),
      getNumpangActive(),
    ]);

  const spending = entries.filter((e) => e.direction === "out" && e.category !== "savings");

  // Personal accounts only
  const personalAccounts = accounts.filter((a) => a.type !== "yayasan");

  return serializeDates({
    personalAccounts,
    spending,
    savings,
    savingsTotal: savingsTotal as { _id: string; count: number; total: number; total_in: number; total_out: number }[],
    loans,
    recurring,
    piutangByMonth: piutangByMonth as { _id: string; count: number; total: number }[],
    numpang,
  });
}

export async function getWajibBulanan(): Promise<Obligation[]> {
  const c = dbCollections(await getDb());
  return c.obligations
    .find({ type: "recurring", org: ORG_ID })
    .sort({ category: 1, created_at: -1 })
    .toArray();
}

export async function getDashboardSummary() {
  const c = dbCollections(await getDb());

  const [accounts, laporanOp, sewa, pengajuanPending, pengajuanTotal, pengajuanByRequestor, cashAccount, wajibBulanan] =
    await Promise.all([
      getAccounts(),
      getLedger("laporan_op"),
      getLedger("sewa"),
      c.obligations.countDocuments({ type: "pengajuan", status: "pending" }),
      c.obligations.aggregate([
        { $match: { type: "pengajuan", status: "pending" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]).toArray(),
      c.obligations.aggregate([
        { $match: { type: "pengajuan", status: "pending" } },
        { $group: { _id: "$requestor", count: { $sum: 1 }, total: { $sum: "$amount" } } },
        { $sort: { total: -1 } },
      ]).toArray(),
      c.accounts.findOne({ _id: ACCOUNTS.cash }),
      c.obligations.find({ type: "recurring", org: ORG_ID, status: "active" }).toArray(),
    ]);

  const cashAwal = Number(cashAccount?.meta?.initial_amount ?? 0) || 0;
  const cashSisa = cashAccount?.balance ?? 0;

  return {
    accounts,
    laporanOp,
    sewa,
    pengajuanPending,
    pengajuanTotalAmount: pengajuanTotal[0]?.total ?? 0,
    pengajuanByRequestor: pengajuanByRequestor as { _id: string; count: number; total: number }[],
    cashYayasan: { awal: cashAwal, sisa: cashSisa, terpakai: cashAwal - cashSisa },
    wajibBulanan,
  };
}

export async function getActivityFeed(
  limit = 30,
  opts: { domain?: string; period?: string } = {},
): Promise<ActivityEvent[]> {
  const c = dbCollections(await getDb());

  // Fetch a larger pool sorted by the timestamp we'll display, so the merged
  // feed isn't missing items whose `date` is recent but `created_at` is old.
  const pool = limit * 3;

  const entryFilter: Filter<EntryFields> = {};
  if (opts.domain) entryFilter.domain = opts.domain;
  if (opts.period) entryFilter.month = opts.period;

  const obligationFilter: Filter<ObligationDoc> = {};
  if (opts.period) obligationFilter.month = opts.period;

  const [entries, obligations] = await Promise.all([
    c.entries.find(entryFilter).sort({ date: -1, created_at: -1 }).limit(pool).toArray(),
    // Obligations don't carry a domain field; only include them when no domain filter is applied.
    opts.domain
      ? Promise.resolve([] as Obligation[])
      : c.obligations.find(obligationFilter).sort({ updated_at: -1 }).limit(pool).toArray(),
  ]);

  const events: ActivityEvent[] = [];

  for (const e of entries) {
    events.push({
      _id: e._id.toString(),
      type: "entry",
      date: e.date?.toString() ?? e.created_at?.toString(),
      title: e.description ?? "Transaksi",
      subtitle: [e.domain, e.category?.replace(/_/g, " ")].filter(Boolean).join(" · "),
      amount: e.amount ?? null,
      direction: e.direction as EntryDirection,
      domain: e.domain,
      category: e.category,
      created_at: e.created_at?.toString() ?? e.date?.toString(),
    });
  }

  for (const o of obligations) {
    events.push({
      _id: o._id.toString(),
      type: "obligation",
      date: o.updated_at?.toString() ?? o.created_at?.toString(),
      title: o.item ?? "Obligation",
      subtitle: [o.type, o.requestor].filter(Boolean).join(" · "),
      amount: o.amount ?? null,
      status: o.status,
      category: o.category,
      created_at: o.created_at?.toString(),
    });
  }

  // Sort by actual transaction date, fallback to created_at for ties
  events.sort((a, b) => {
    const dateA = new Date(a.date ?? a.created_at).getTime();
    const dateB = new Date(b.date ?? b.created_at).getTime();
    if (dateB !== dateA) return dateB - dateA;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  return events.slice(0, limit);
}

export async function getDanaPribadiSummary() {
  const c = dbCollections(await getDb());

  const [bcaAccount, briAccount, personalEntries, numpangActive] = await Promise.all([
    c.accounts.findOne({ _id: ACCOUNTS.personalBca }),
    c.accounts.findOne({ _id: ACCOUNTS.personalBri }),
    c.entries
      .find({ domain: "personal" })
      .sort({ date: -1 })
      .limit(50)
      .toArray(),
    getNumpangActive(),
  ]);

  const bcaBalance = bcaAccount?.balance ?? 0;
  const briEstatement = briAccount?.balance ?? 0;
  const numpangTotal = numpangActive.reduce((s, n) => s + n.amount, 0);
  const briKas = briEstatement - numpangTotal;
  const briBersih = briKas;
  const totalCashBersih = bcaBalance + briBersih;

  const numpangEntries = numpangActive.map((n) => ({ key: n._id, amount: n.amount, description: n.description }));

  return {
    bcaAccount,
    briAccount,
    bcaBalance,
    briKas,
    briEstatement,
    briBersih,
    numpangTotal,
    numpangEntries,
    totalCashBersih,
    personalEntries,
  };
}

export interface LaporanOpReconciliation {
  ledgerMasuk: number;
  ledgerKeluar: number;
  entriesMasuk: number;
  entriesKeluar: number;
  diffMasuk: number;
  diffKeluar: number;
  account: string;
  asOf?: string;
}

export async function getLaporanOpReconciliation(): Promise<LaporanOpReconciliation | null> {
  const c = dbCollections(await getDb());
  const ledger = await getLedger("laporan_op");
  if (!ledger?.laporan_op) return null;

  const account = ACCOUNTS.operasional;
  const agg = await c.entries.aggregate([
    { $match: { account } },
    { $group: {
        _id: "$direction",
        total: { $sum: "$amount" },
      } },
  ]).toArray();
  const entriesMasuk = agg.find((a) => a._id === "in")?.total ?? 0;
  const entriesKeluar = agg.find((a) => a._id === "out")?.total ?? 0;
  const ledgerMasuk = ledger.laporan_op.totals.masuk;
  const ledgerKeluar = ledger.laporan_op.totals.keluar;
  return {
    ledgerMasuk,
    ledgerKeluar,
    entriesMasuk,
    entriesKeluar,
    diffMasuk: entriesMasuk - ledgerMasuk,
    diffKeluar: entriesKeluar - ledgerKeluar,
    account,
    asOf: dbDateToDateOnlyString(ledger.as_of),
  };
}

export async function getDataIntegrityIssues(): Promise<DataIntegrityIssue[]> {
  const c = dbCollections(await getDb());
  const issues: DataIntegrityIssue[] = [];

  // 1. Lunas obligations missing resolved_at
  const lunasOrphan = await c.obligations.find({
    status: "lunas",
    $or: [{ resolved_at: { $in: [null] } }, { resolved_at: { $exists: false } }],
  }).toArray();
  for (const o of lunasOrphan) {
    issues.push({
      kind: "lunas_missing_resolved_at",
      severity: "error",
      message: `Obligation lunas tanpa resolved_at: ${o.item}`,
      entity_id: o._id.toString(),
      hint: "Set resolved_at + resolved_by, atau revert ke pending",
    });
  }

  // 2. Pengajuan tanpa sumber_dana
  const pengajuanNoSumber = await c.obligations.countDocuments({
    type: "pengajuan", status: "pending",
    $or: [{ sumber_dana: null }, { sumber_dana: { $exists: false } }],
  });
  if (pengajuanNoSumber > 0) {
    issues.push({
      kind: "pengajuan_missing_sumber_dana",
      severity: "warn",
      message: `${pengajuanNoSumber} pengajuan pending tanpa sumber_dana`,
      hint: "Tag sumber_dana untuk routing yang benar",
    });
  }

  // 3. sewa_masuk entries tanpa tahap_sewa
  const sewaUntagged = await c.entries.countDocuments({
    category: "sewa_masuk",
    $or: [{ tahap_sewa: null }, { tahap_sewa: { $exists: false } }, { tahap_sewa: "UNKNOWN" }],
  });
  if (sewaUntagged > 0) {
    issues.push({
      kind: "sewa_untagged",
      severity: "warn",
      message: `${sewaUntagged} sewa_masuk entries tanpa tahap_sewa`,
      hint: "Run scripts/migrations/004_backfill_tahap_sewa.py --commit",
    });
  }

  // 4. Sewa entries in T5_PRE gap (Mar 10-29) — needs Pak Angkasa review
  const t5pre = await c.entries.countDocuments({
    category: "sewa_masuk", tahap_sewa: "2026-T5_PRE",
  });
  if (t5pre > 0) {
    issues.push({
      kind: "sewa_t5_pre_gap",
      severity: "info",
      message: `${t5pre} sewa entries jatuh di gap Mar 10-29 (T5_PRE)`,
      hint: "Konfirmasi ke Pak Angkasa: tahap sebenarnya untuk window ini",
    });
  }

  // 5. Active loans without schedule
  const loanNoSchedule = await c.obligations.countDocuments({
    type: "loan", status: "active",
    $or: [{ schedule: null }, { schedule: { $size: 0 } }],
  });
  if (loanNoSchedule > 0) {
    issues.push({
      kind: "loan_missing_schedule",
      severity: "warn",
      message: `${loanNoSchedule} loan aktif tanpa schedule array`,
    });
  }

  // 6. Stale balance ledger references (should be fully archived)
  const oldBalance = await c.ledgers.countDocuments({ type: "balance" });
  if (oldBalance > 0) {
    issues.push({
      kind: "stale_balance_ledger",
      severity: "error",
      message: `${oldBalance} ledger doc masih type=balance (harus archived)`,
      hint: "Run scripts/migrations/006_archive_balance_ledger.py --commit",
    });
  }

  return issues;
}

export async function getSewaHistory(): Promise<Ledger[]> {
  const c = dbCollections(await getDb());
  return c.ledgers
    .find({ type: "sewa" })
    .sort({ updated_at: -1 })
    .toArray();
}

export async function getSewaDanaUsage(tahap?: string) {
  const c = dbCollections(await getDb());

  const sewaLedger = await getLedger("sewa");
  const targetTahap = tahap ?? sewaLedger?.period_code ?? sewaLedger?.period;

  // Source of truth: sum entries.in for that tahap (live; ledger is snapshot only).
  const masukAgg = await c.entries.aggregate([
    { $match: { category: "sewa_masuk", direction: "in",
                ...(targetTahap ? { tahap_sewa: targetTahap } : {}) } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]).toArray();
  const totalMasuk = masukAgg[0]?.total ?? sewaLedger?.sewa?.total ?? 0;

  const filter: Filter<EntryFields> = {
    domain: "yayasan",
    direction: "out",
    dana_sumber: "sewa",
    ...(targetTahap ? { tahap_sewa: targetTahap } : {}),
  };

  const pengeluaranSewa = await c.entries
    .find(filter)
    .sort({ date: -1 })
    .toArray();

  const totalTerpakai = pengeluaranSewa.reduce((s, e) => s + e.amount, 0);
  const sisaDana = totalMasuk - totalTerpakai;

  return {
    totalMasuk,
    pengeluaranSewa,
    totalTerpakai,
    sisaDana,
    tahap: targetTahap,
  };
}

export async function getPendingTransfers() {
  const ledger = await getLedger("sewa");
  const locations = ledger?.sewa?.locations ?? [];
  const pending = locations.filter(
    (l) => l.pipeline?.stage && l.pipeline.stage !== "tercatat",
  );
  const totalExpected = pending.reduce(
    (s, l) => s + (l.pipeline?.expected_amount ?? l.amount ?? 0),
    0,
  );
  return { pending, totalExpected };
}

export interface DuplicateGroup {
  key: string;
  date: string;
  amount: number;
  entries: Entry[];
}

export async function findDuplicateEntries(opts: { period?: string } = {}): Promise<DuplicateGroup[]> {
  const c = dbCollections(await getDb());
  const filter: Filter<EntryFields> = {};
  if (opts.period) filter.month = opts.period;

  const entries = await c.entries
    .find(filter)
    .sort({ date: -1 })
    .limit(500)
    .toArray();

  const groups = new Map<string, Entry[]>();
  for (const e of entries) {
    const day = new Date(e.date).toISOString().slice(0, 10);
    const cp = (e.counterparty ?? "").toLowerCase().trim().replace(/\s+/g, " ");
    const key = `${day}|${e.amount}|${e.direction}|${cp}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(e);
  }

  const dupes: DuplicateGroup[] = [];
  for (const [key, items] of groups) {
    if (items.length < 2) continue;
    const [day, amountStr] = key.split("|");
    dupes.push({ key, date: day, amount: Number(amountStr), entries: items });
  }
  dupes.sort((a, b) => b.date.localeCompare(a.date));
  return dupes;
}

export interface DuplicateObligation {
  amount: number;
  obligations: Obligation[];
}

export interface DataQualityReport {
  duplicateObligations: DuplicateObligation[];
  missingFields: Record<string, number>;
  totalObligations: number;
  duplicateCount: number;
  missingFieldCount: number;
}

export async function findDuplicateObligations(opts: { month?: string } = {}): Promise<DuplicateObligation[]> {
  const c = dbCollections(await getDb());
  const filter: Filter<ObligationDoc> = { type: "pengajuan" };
  if (opts.month) filter.month = opts.month;

  const obligations = await c.obligations
    .find(filter)
    .sort({ created_at: -1 })
    .toArray();

  const byAmount = new Map<number, Obligation[]>();
  for (const ob of obligations) {
    const amount = ob.amount ?? 0;
    if (amount === 0) continue; // Skip zero amounts
    if (!byAmount.has(amount)) byAmount.set(amount, []);
    byAmount.get(amount)!.push(ob);
  }

  const duplicates: DuplicateObligation[] = [];
  for (const [amount, items] of byAmount) {
    if (items.length > 1) {
      duplicates.push({ amount, obligations: items });
    }
  }

  duplicates.sort((a, b) => b.amount - a.amount);
  return duplicates;
}

export async function validateObligationData(opts: { month?: string } = {}): Promise<DataQualityReport> {
  const c = dbCollections(await getDb());
  const filter: Filter<ObligationDoc> = { type: "pengajuan" };
  if (opts.month) filter.month = opts.month;

  const obligations = await c.obligations.find(filter).toArray();

  const missingFields: Record<string, number> = {};
  const requiredFields = ['item', 'amount', 'category', 'requestor', 'sumber_dana'];

  for (const ob of obligations) {
    for (const field of requiredFields) {
      const value = ob[field as keyof Obligation];
      if (value === null || value === undefined || value === "") {
        missingFields[field] = (missingFields[field] || 0) + 1;
      }
    }
  }

  const duplicateObligations = await findDuplicateObligations(opts);

  return {
    duplicateObligations,
    missingFields,
    totalObligations: obligations.length,
    duplicateCount: duplicateObligations.reduce((sum, dup) => sum + dup.obligations.length - 1, 0),
    missingFieldCount: Object.values(missingFields).reduce((sum, count) => sum + count, 0)
  };
}

export async function removeDuplicateObligations(keepFirst: boolean = true): Promise<{ removed: number; savedAmount: number }> {
  const c = dbCollections(await getDb());

  const duplicates = await findDuplicateObligations();
  let removed = 0;
  let savedAmount = 0;

  for (const dup of duplicates) {
    const toRemove = keepFirst ? dup.obligations.slice(1) : dup.obligations.slice(0, -1);

    for (const ob of toRemove) {
      await c.obligations.deleteOne({ _id: new ObjectId(String(ob._id)) });
      removed++;
      savedAmount += ob.amount ?? 0;
    }
  }

  return { removed, savedAmount };
}

export async function getPengeluaranAngkasa(month?: string) {
  const c = dbCollections(await getDb());

  const baseFilter: Record<string, unknown> = { owner: "angkasa", domain: "personal" };
  const monthFilter: Record<string, unknown> = month ? { ...baseFilter, month } : baseFilter;

  const [entriesOut, entriesIn, allMonths, categorySummary, monthlyCashflow] = await Promise.all([
    c.entries.find({ ...monthFilter, direction: "out" }).sort({ date: -1 }).toArray(),
    c.entries.find({ ...monthFilter, direction: "in" }).sort({ date: -1 }).toArray(),
    c.entries.distinct("month", baseFilter),
    c.entries
      .aggregate([
        { $match: { ...monthFilter, direction: "out" } },
        { $group: { _id: "$category", count: { $sum: 1 }, total: { $sum: "$amount" } } },
        { $sort: { total: -1 } },
      ])
      .toArray(),
    c.entries
      .aggregate([
        { $match: baseFilter },
        { $group: { _id: { month: "$month", direction: "$direction" }, total: { $sum: "$amount" } } },
        { $sort: { "_id.month": -1 } },
      ])
      .toArray(),
  ]);

  const entries = [...entriesOut, ...entriesIn].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Build cashflow map: month -> { in, out }
  const cashflowMap = new Map<string, { in: number; out: number }>();
  for (const m of allMonths as string[]) cashflowMap.set(m, { in: 0, out: 0 });
  for (const row of monthlyCashflow) {
    const m = row._id.month as string;
    const d = row._id.direction as string;
    const cur = cashflowMap.get(m) ?? { in: 0, out: 0 };
    if (d === "in") cur.in = row.total;
    if (d === "out") cur.out = row.total;
    cashflowMap.set(m, cur);
  }

  const currentCashflow = month ? (cashflowMap.get(month) ?? { in: 0, out: 0 }) : null;

  return serializeDates({
    entries,
    entriesOut,
    entriesIn,
    months: (allMonths as string[]).sort().reverse(),
    categorySummary: categorySummary as { _id: string; count: number; total: number }[],
    totalOut: entriesOut.reduce((s, e) => s + e.amount, 0),
    totalIn: entriesIn.reduce((s, e) => s + e.amount, 0),
    countOut: entriesOut.length,
    countIn: entriesIn.length,
    cashflowByMonth: Object.fromEntries(cashflowMap),
    currentCashflow,
  });
}

export async function getDashboardTrend(): Promise<{ month: string; net: number }[]> {
  const c = dbCollections(await getDb());
  const docs = await c.ledgers
    .find({ type: "laporan_op" })
    .sort({ period: -1 })
    .limit(13)
    .toArray();
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
  const c = dbCollections(await getDb());
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
  const c = dbCollections(await getDb());
  const docs = await c.ledgers
    .find({ type: "laporan_op" })
    .sort({ period: -1 })
    .limit(6)
    .toArray();
  return serializeDates(
    docs
      .filter((d) => d.period != null && d.laporan_op?.totals != null)
      .map((d) => {
        const month = d.period_code ?? (d.as_of ? new Date(d.as_of as string).toISOString().substring(0, 7) : null) ?? d.period;
        return { month: month as string, masuk: d.laporan_op!.totals.masuk, keluar: d.laporan_op!.totals.keluar };
      })
      .sort((a, b) => a.month.localeCompare(b.month))
  );
}
