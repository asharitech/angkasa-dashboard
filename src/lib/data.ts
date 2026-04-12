import { getDb } from "./mongodb";
import type { Account, Obligation, Ledger, Entry, ActivityEvent } from "./types";

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
      getEntries({ owner: "angkasa" }, 50),
      getEntries({ category: "savings" }, 50),
      getObligations({ type: "loan", status: "active" }),
      getObligations({ type: "recurring", status: "active" }),
      db.collection("obligations").aggregate([
        { $match: { type: "pengajuan", status: "pending", requestor: "angkasa" } },
        { $group: { _id: "$month", count: { $sum: 1 }, total: { $sum: "$amount" } } },
        { $sort: { _id: 1 } },
      ]).toArray(),
      db.collection("entries").aggregate([
        { $match: { category: "savings" } },
        { $group: { _id: "$owner", count: { $sum: 1 }, total: { $sum: "$amount" } } },
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
    savingsTotal: savingsTotal as { _id: string; count: number; total: number }[],
    loans,
    recurring,
    piutangByMonth: piutangByMonth as { _id: string; count: number; total: number }[],
  };
}

export async function getDashboardSummary() {
  const db = await getDb();

  const [accounts, laporanOp, sewa, pengajuanPending, pengajuanTotal, pengajuanByRequestor] =
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
    ]);

  return {
    accounts,
    laporanOp,
    sewa,
    pengajuanPending,
    pengajuanTotalAmount: pengajuanTotal[0]?.total ?? 0,
    pengajuanByRequestor: pengajuanByRequestor as { _id: string; count: number; total: number }[],
  };
}

export async function getActivityFeed(limit = 30): Promise<ActivityEvent[]> {
  const db = await getDb();

  const [entries, obligations] = await Promise.all([
    db.collection("entries").find().sort({ created_at: -1 }).limit(limit).toArray(),
    db.collection("obligations").find().sort({ updated_at: -1 }).limit(limit).toArray(),
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
      domain: o.type,
      category: o.category,
      created_at: o.created_at?.toString(),
    });
  }

  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return events.slice(0, limit);
}

export async function getSewaHistory(): Promise<Ledger[]> {
  const db = await getDb();
  return db
    .collection("ledgers")
    .find({ type: "sewa" })
    .sort({ updated_at: -1 })
    .toArray() as unknown as Ledger[];
}
