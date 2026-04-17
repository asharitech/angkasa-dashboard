import { getDb } from "./mongodb";
import type { Account, Obligation, Ledger, Entry, ActivityEvent, Numpang, DataIntegrityIssue } from "./types";
import type { Document } from "mongodb";
import { validateObligation, validateEntry } from "./validate";

export async function getNumpang(): Promise<Numpang[]> {
  const db = await getDb();
  return db.collection("numpang").find({}).sort({ amount: -1 }).toArray() as unknown as Numpang[];
}

export async function getNumpangActive(): Promise<Numpang[]> {
  const db = await getDb();
  return db.collection("numpang").find({ status: "active" }).sort({ amount: -1 }).toArray() as unknown as Numpang[];
}

export async function computeBriKas(): Promise<{ briBalance: number; numpangTotal: number; briKas: number }> {
  const db = await getDb();
  const [bri, numpang] = await Promise.all([
    db.collection("accounts").findOne({ _id: "bri_angkasa" as unknown as import("mongodb").ObjectId }),
    getNumpangActive(),
  ]);
  const briBalance = (bri as unknown as Account)?.balance ?? 0;
  const numpangTotal = numpang.reduce((s, n) => s + n.amount, 0);
  return { briBalance, numpangTotal, briKas: briBalance - numpangTotal };
}

export async function getAccounts(): Promise<Account[]> {
  const db = await getDb();
  return db.collection("accounts").find().toArray() as unknown as Account[];
}

export async function getLedger(type: string, current = true): Promise<Ledger | null> {
  const db = await getDb();
  return db.collection("ledgers").findOne({
    type,
    is_current: current,
  }) as unknown as Ledger | null;
}

export async function getLedgerByCode(type: string, period_code: string): Promise<Ledger | null> {
  const db = await getDb();
  return db.collection("ledgers").findOne({
    type,
    period_code,
  }) as unknown as Ledger | null;
}

export async function getAllLedgers(): Promise<Ledger[]> {
  const db = await getDb();
  return db.collection("ledgers").find({ is_current: true }).toArray() as unknown as Ledger[];
}

export async function getObligations(filter: Record<string, unknown> = {}): Promise<Obligation[]> {
  const db = await getDb();
  return db
    .collection("obligations")
    .find(filter)
    .sort({ month: 1, created_at: -1 })
    .toArray() as unknown as Obligation[];
}

export async function getObligationById(id: string): Promise<Obligation | null> {
  const db = await getDb();
  const { ObjectId } = await import("mongodb");
  return db.collection("obligations").findOne({ _id: new ObjectId(id) }) as unknown as Obligation | null;
}

export async function updateObligation(id: string, data: Record<string, unknown>): Promise<void> {
  const db = await getDb();
  const { ObjectId } = await import("mongodb");
  const existing = await db.collection("obligations").findOne({ _id: new ObjectId(id) });
  validateObligation({ ...(existing ?? {}), ...data });
  await db.collection("obligations").updateOne(
    { _id: new ObjectId(id) },
    { $set: { ...data, updated_at: new Date() } }
  );
}

export async function deleteObligation(id: string): Promise<void> {
  const db = await getDb();
  const { ObjectId } = await import("mongodb");
  await db.collection("obligations").deleteOne({ _id: new ObjectId(id) });
}

export async function createObligation(data: Record<string, unknown>): Promise<string> {
  validateObligation(data);
  const db = await getDb();
  const result = await db.collection("obligations").insertOne({
    ...data,
    created_at: new Date(),
    updated_at: new Date(),
  });
  return result.insertedId.toString();
}

export async function getEntries(filter: Record<string, unknown> = {}, limit = 50): Promise<Entry[]> {
  const db = await getDb();
  return db
    .collection("entries")
    .find(filter)
    .sort({ date: -1 })
    .limit(limit)
    .toArray() as unknown as Entry[];
}

export async function createEntry(data: Record<string, unknown>): Promise<string> {
  validateEntry(data);
  const db = await getDb();
  const result = await db.collection("entries").insertOne({
    ...data,
    created_at: new Date(),
    updated_at: new Date(),
  });
  return result.insertedId.toString();
}

export async function deleteEntry(id: string): Promise<void> {
  const db = await getDb();
  const { ObjectId } = await import("mongodb");
  await db.collection("entries").deleteOne({ _id: new ObjectId(id) });
}

export async function updateAccount(id: string, data: Record<string, unknown>): Promise<void> {
  const db = await getDb();
  await db.collection("accounts").updateOne(
    { _id: id as unknown as import("mongodb").ObjectId },
    { $set: { ...data, updated_at: new Date() } }
  );
}

export async function getPribadiSummary() {
  const db = await getDb();

  const [accounts, entries, savings, loans, recurring, piutangByMonth, savingsTotal, numpang] =
    await Promise.all([
      getAccounts(),
      getEntries({ owner: "angkasa", domain: { $ne: "yayasan" } }, 50),
      getEntries({ category: "savings" }, 50),
      getObligations({ type: "loan", status: "active" }),
      getObligations({ type: "recurring", status: "active" }),
      db.collection("obligations").aggregate([
        { $match: { type: "pengajuan", status: "pending", sumber_dana: "BRI_ANGKASA" } },
        { $group: { _id: "$month", count: { $sum: 1 }, total: { $sum: "$amount" } } },
        { $sort: { _id: 1 } },
      ]).toArray(),
      db.collection("entries").aggregate([
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

  return {
    personalAccounts,
    spending,
    savings,
    savingsTotal: savingsTotal as { _id: string; count: number; total: number; total_in: number; total_out: number }[],
    loans,
    recurring,
    piutangByMonth: piutangByMonth as { _id: string; count: number; total: number }[],
    numpang,
  };
}

export async function getDashboardSummary() {
  const db = await getDb();

  const [accounts, laporanOp, sewa, pengajuanPending, pengajuanTotal, pengajuanByRequestor, cashAccount] =
    await Promise.all([
      getAccounts(),
      getLedger("laporan_op"),
      getLedger("sewa"),
      db.collection("obligations").countDocuments({ type: "pengajuan", status: "pending" }),
      db.collection("obligations").aggregate([
        { $match: { type: "pengajuan", status: "pending" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]).toArray(),
      db.collection("obligations").aggregate([
        { $match: { type: "pengajuan", status: "pending" } },
        { $group: { _id: "$requestor", count: { $sum: 1 }, total: { $sum: "$amount" } } },
        { $sort: { total: -1 } },
      ]).toArray(),
      db.collection("accounts").findOne({ _id: "cash_yayasan" as unknown as import("mongodb").ObjectId }) as unknown as Promise<Account | null>,
    ]);

  const cashAwal = (cashAccount as unknown as { meta?: { initial_amount?: number } })?.meta?.initial_amount ?? 0;
  const cashSisa = cashAccount?.balance ?? 0;

  return {
    accounts,
    laporanOp,
    sewa,
    pengajuanPending,
    pengajuanTotalAmount: pengajuanTotal[0]?.total ?? 0,
    pengajuanByRequestor: pengajuanByRequestor as { _id: string; count: number; total: number }[],
    cashYayasan: { awal: cashAwal, sisa: cashSisa, terpakai: cashAwal - cashSisa },
  };
}

export async function getActivityFeed(
  limit = 30,
  opts: { domain?: string; period?: string } = {},
): Promise<ActivityEvent[]> {
  const db = await getDb();

  // Fetch a larger pool sorted by the timestamp we'll display, so the merged
  // feed isn't missing items whose `date` is recent but `created_at` is old.
  const pool = limit * 3;

  const entryFilter: Record<string, unknown> = {};
  if (opts.domain) entryFilter.domain = opts.domain;
  if (opts.period) entryFilter.month = opts.period;

  const obligationFilter: Record<string, unknown> = {};
  if (opts.period) obligationFilter.month = opts.period;

  const [entries, obligations] = await Promise.all([
    db.collection("entries").find(entryFilter).sort({ date: -1, created_at: -1 }).limit(pool).toArray(),
    // Obligations don't carry a domain field; only include them when no domain filter is applied.
    opts.domain
      ? Promise.resolve([] as Document[])
      : db.collection("obligations").find(obligationFilter).sort({ updated_at: -1 }).limit(pool).toArray(),
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
      direction: e.direction,
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
  const db = await getDb();

  const [bcaAccount, briAccount, personalEntries, numpangActive] = await Promise.all([
    db.collection("accounts").findOne({ _id: "bca_angkasa" as unknown as import("mongodb").ObjectId }) as unknown as Promise<Account | null>,
    db.collection("accounts").findOne({ _id: "bri_angkasa" as unknown as import("mongodb").ObjectId }) as unknown as Promise<Account | null>,
    db
      .collection("entries")
      .find({ domain: "personal" })
      .sort({ date: -1 })
      .limit(50)
      .toArray() as unknown as Promise<Entry[]>,
    getNumpangActive(),
  ]);

  const bcaBalance = (bcaAccount as unknown as Account)?.balance ?? 0;
  const briEstatement = (briAccount as unknown as Account)?.balance ?? 0;
  const numpangTotal = numpangActive.reduce((s, n) => s + n.amount, 0);
  const briKas = briEstatement - numpangTotal;
  const briBersih = briKas;
  const totalCashBersih = bcaBalance + briBersih;

  const numpangEntries = numpangActive.map((n) => ({ key: n._id, amount: n.amount, description: n.description }));

  return {
    bcaAccount: bcaAccount as unknown as Account | null,
    briAccount: briAccount as unknown as Account | null,
    bcaBalance,
    briKas,
    briEstatement,
    briBersih,
    numpangTotal,
    numpangEntries,
    totalCashBersih,
    personalEntries: personalEntries as unknown as Entry[],
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
  const db = await getDb();
  const ledger = await getLedger("laporan_op");
  if (!ledger?.laporan_op) return null;

  const account = "btn_yayasan";
  const agg = await db.collection("entries").aggregate([
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
    asOf: ledger.as_of,
  };
}

export async function getDataIntegrityIssues(): Promise<DataIntegrityIssue[]> {
  const db = await getDb();
  const issues: DataIntegrityIssue[] = [];

  // 1. Lunas obligations missing resolved_at
  const lunasOrphan = await db.collection("obligations").find({
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
  const pengajuanNoSumber = await db.collection("obligations").countDocuments({
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
  const sewaUntagged = await db.collection("entries").countDocuments({
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
  const t5pre = await db.collection("entries").countDocuments({
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
  const loanNoSchedule = await db.collection("obligations").countDocuments({
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
  const oldBalance = await db.collection("ledgers").countDocuments({ type: "balance" });
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
  const db = await getDb();
  return db
    .collection("ledgers")
    .find({ type: "sewa" })
    .sort({ updated_at: -1 })
    .toArray() as unknown as Ledger[];
}

export async function getSewaDanaUsage(tahap?: string) {
  const db = await getDb();

  const sewaLedger = await getLedger("sewa");
  const targetTahap = tahap ?? sewaLedger?.period_code ?? sewaLedger?.period;

  // Source of truth: sum entries.in for that tahap (live; ledger is snapshot only).
  const masukAgg = await db.collection("entries").aggregate([
    { $match: { category: "sewa_masuk", direction: "in",
                ...(targetTahap ? { tahap_sewa: targetTahap } : {}) } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]).toArray();
  const totalMasuk = masukAgg[0]?.total ?? sewaLedger?.sewa?.total ?? 0;

  const filter: Record<string, unknown> = {
    domain: "yayasan",
    direction: "out",
    dana_sumber: "sewa",
  };
  if (targetTahap) filter.tahap_sewa = targetTahap;

  const pengeluaranSewa = await db
    .collection("entries")
    .find(filter)
    .sort({ date: -1 })
    .toArray() as unknown as Entry[];

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
  const db = await getDb();
  const filter: Record<string, unknown> = {};
  if (opts.period) filter.month = opts.period;

  const entries = (await db
    .collection("entries")
    .find(filter)
    .sort({ date: -1 })
    .limit(500)
    .toArray()) as unknown as Entry[];

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
  const db = await getDb();
  const filter: Record<string, unknown> = { type: "pengajuan" };
  if (opts.month) filter.month = opts.month;

  const obligations = (await db
    .collection("obligations")
    .find(filter)
    .sort({ created_at: -1 })
    .toArray()) as unknown as Obligation[];

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
  const db = await getDb();
  const filter: Record<string, unknown> = { type: "pengajuan" };
  if (opts.month) filter.month = opts.month;

  const obligations = (await db
    .collection("obligations")
    .find(filter)
    .toArray()) as unknown as Obligation[];

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
  const db = await getDb();

  const duplicates = await findDuplicateObligations();
  let removed = 0;
  let savedAmount = 0;

  for (const dup of duplicates) {
    const toRemove = keepFirst ? dup.obligations.slice(1) : dup.obligations.slice(0, -1);

    for (const ob of toRemove) {
      const { ObjectId } = await import("mongodb");
      await db.collection("obligations").deleteOne({ _id: new ObjectId(ob._id) });
      removed++;
      savedAmount += ob.amount ?? 0;
    }
  }

  return { removed, savedAmount };
}
