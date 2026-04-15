import { getDb } from "./mongodb";
import type { Account, Obligation, Ledger, Entry, ActivityEvent } from "./types";
import type { Document } from "mongodb";

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

  const [balance, accounts, entries, savings, loans, recurring, piutangByMonth, savingsTotal] =
    await Promise.all([
      getLedger("balance"),
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
    ]);

  const spending = entries.filter((e) => e.direction === "out" && e.category !== "savings");

  // Personal accounts only
  const personalAccounts = accounts.filter((a) => a.type !== "yayasan");

  return {
    balance,
    personalAccounts,
    spending,
    savings,
    savingsTotal: savingsTotal as { _id: string; count: number; total: number; total_in: number; total_out: number }[],
    loans,
    recurring,
    piutangByMonth: piutangByMonth as { _id: string; count: number; total: number }[],
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

  const [balance, bcaAccount, briAccount, personalEntries] = await Promise.all([
    getLedger("balance"),
    db.collection("accounts").findOne({ _id: "bca_angkasa" as unknown as import("mongodb").ObjectId }) as unknown as Promise<Account | null>,
    db.collection("accounts").findOne({ _id: "bri_angkasa" as unknown as import("mongodb").ObjectId }) as unknown as Promise<Account | null>,
    db
      .collection("entries")
      .find({ domain: "personal" })
      .sort({ date: -1 })
      .limit(50)
      .toArray() as unknown as Promise<Entry[]>,
  ]);

  const bal = balance?.balance;
  const bcaBalance = (bcaAccount as unknown as Account)?.balance ?? bal?.cash?.bca ?? 0;
  const briKas = bal?.cash?.bri_kas ?? 0;
  const briEstatement = (briAccount as unknown as Account)?.balance ?? 0;
  const numpang = bal?.numpang ?? {};
  const numpangTotal: number = (numpang as Record<string, number>).total ?? 0;

  // BRI bersih = kas yang benar-benar milik Angkasa
  const briBersih = briKas;
  // Total cash bersih Pak Angkasa
  const totalCashBersih = bcaBalance + briBersih;

  // Numpang entries: exclude 'total' key, map to array
  const numpangEntries = Object.entries(numpang as Record<string, number>)
    .filter(([k]) => k !== "total")
    .map(([key, amount]) => ({ key, amount }));

  return {
    balance,
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

  // Total sewa dari ledger aktif (bukan dari entries)
  const sewaLedger = await getLedger("sewa");
  const totalMasuk = sewaLedger?.sewa?.total ?? 0;

  // Pengeluaran yang di-tag dari dana sewa
  const filter: Record<string, unknown> = {
    domain: "yayasan",
    direction: "out",
    dana_sumber: "sewa",
  };
  if (tahap) filter.tahap_sewa = tahap;

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
