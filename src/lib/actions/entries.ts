"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/mongodb";
import { dbCollections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";

export interface EntryInput {
  date: string;
  account: string;
  direction: "in" | "out";
  amount: number;
  counterparty: string;
  description: string;
  domain: string;
  category: string;
  owner?: string;
  dana_sumber?: "sewa" | "operasional" | null;
  tahap_sewa?: string | null;
  ref_no?: string | null;
}

export interface EntryActionResult {
  ok: boolean;
  id?: string;
  error?: string;
}

export async function createEntryAction(data: EntryInput): Promise<EntryActionResult> {
  try {
    const c = dbCollections(await getDb());
    const entry = {
      ...data,
      owner: data.owner ?? "angkasa",
      month: data.date.substring(0, 7),
      source: "manual",
      created_at: new Date(),
      updated_at: new Date(),
    };
    const result = await c.entries.insertOne(entry);

    // Update account balance
    if (entry.direction === "out") {
      await c.accounts.updateOne(
        { _id: entry.account },
        { $inc: { balance: -entry.amount }, $set: { updated_at: new Date() } }
      );
    } else {
      await c.accounts.updateOne(
        { _id: entry.account },
        { $inc: { balance: entry.amount }, $set: { updated_at: new Date() } }
      );
    }

    revalidatePath("/pribadi");
    revalidatePath("/");
    return { ok: true, id: result.insertedId.toString() };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal menyimpan" };
  }
}

export async function updateEntryAction(
  id: string,
  data: Partial<EntryInput>
): Promise<EntryActionResult> {
  try {
    const c = dbCollections(await getDb());

    // Get old entry to adjust balance
    const old = await c.entries.findOne({ _id: new ObjectId(id) });
    if (!old) throw new Error("Transaksi tidak ditemukan");

    const update: Record<string, unknown> = { updated_at: new Date() };
    if (data.date != null) {
      update.date = data.date;
      update.month = data.date.substring(0, 7);
    }
    if (data.account != null) update.account = data.account;
    if (data.direction != null) update.direction = data.direction;
    if (data.amount != null) update.amount = data.amount;
    if (data.counterparty != null) update.counterparty = data.counterparty;
    if (data.description != null) update.description = data.description;
    if (data.domain != null) update.domain = data.domain;
    if (data.category != null) update.category = data.category;
    if (data.dana_sumber !== undefined) update.dana_sumber = data.dana_sumber;
    if (data.tahap_sewa !== undefined) update.tahap_sewa = data.tahap_sewa;
    if (data.ref_no !== undefined) update.ref_no = data.ref_no;

    await c.entries.updateOne({ _id: new ObjectId(id) }, { $set: update });

    // Adjust balance if amount/direction/account changed
    const oldDelta = old.direction === "out" ? -old.amount : old.amount;
    const newAmount = data.amount ?? old.amount;
    const newDirection = data.direction ?? (old.direction as "in" | "out");
    const newAccount = data.account ?? old.account;
    const newDelta = newDirection === "out" ? -newAmount : newAmount;

    if (old.account === newAccount) {
      const diff = newDelta - oldDelta;
      if (diff !== 0) {
        await c.accounts.updateOne(
          { _id: newAccount },
          { $inc: { balance: diff }, $set: { updated_at: new Date() } }
        );
      }
    } else {
      // Revert old account
      await c.accounts.updateOne(
        { _id: old.account },
        { $inc: { balance: -oldDelta }, $set: { updated_at: new Date() } }
      );
      // Apply to new account
      await c.accounts.updateOne(
        { _id: newAccount },
        { $inc: { balance: newDelta }, $set: { updated_at: new Date() } }
      );
    }

    revalidatePath("/pribadi");
    revalidatePath("/");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal menyimpan" };
  }
}

export async function deleteEntryAction(id: string): Promise<EntryActionResult> {
  try {
    const c = dbCollections(await getDb());
    const entry = await c.entries.findOne({ _id: new ObjectId(id) });
    if (!entry) throw new Error("Transaksi tidak ditemukan");

    await c.entries.deleteOne({ _id: new ObjectId(id) });

    // Revert balance
    const delta = entry.direction === "out" ? entry.amount : -entry.amount;
    await c.accounts.updateOne(
      { _id: entry.account },
      { $inc: { balance: delta }, $set: { updated_at: new Date() } }
    );

    revalidatePath("/pribadi");
    revalidatePath("/");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal menghapus" };
  }
}

export async function getEntryByIdAction(id: string) {
  const c = dbCollections(await getDb());
  const entry = await c.entries.findOne({ _id: new ObjectId(id) });
  if (!entry) return null;
  // Simple serialization for RSC/Client boundary
  return JSON.parse(JSON.stringify(entry));
}
