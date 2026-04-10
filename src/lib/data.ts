import { getDb } from "./mongodb";
import type { Account, Obligation, Ledger, Entry } from "./types";

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

export async function getDashboardSummary() {
  const [accounts, laporanOp, balance, sewa] = await Promise.all([
    getAccounts(),
    getLedger("laporan_op"),
    getLedger("balance"),
    getLedger("sewa"),
  ]);

  const db = await getDb();

  const [pengajuanPending, pengajuanTotal, loanActive, recurringActive, recentEntries] =
    await Promise.all([
      db.collection("obligations").countDocuments({ type: "pengajuan", status: "pending" }),
      db.collection("obligations").aggregate([
        { $match: { type: "pengajuan", status: "pending" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]).toArray(),
      getObligations({ type: "loan", status: "active" }),
      getObligations({ type: "recurring", status: "active" }),
      getEntries({}, 10),
    ]);

  return {
    accounts,
    laporanOp,
    balance,
    sewa,
    pengajuanPending,
    pengajuanTotalAmount: pengajuanTotal[0]?.total ?? 0,
    loanActive,
    recurringActive,
    recentEntries,
  };
}
