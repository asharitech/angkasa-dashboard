"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/mongodb";
import { dbCollections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";

export async function updateEmailNotifAction(
  id: string,
  data: {
    status?: "pending" | "approved" | "rejected" | "ignored";
    classification?: string;
    assigned_category?: string;
    assigned_account?: string;
    notes?: string;
  }
) {
  const c = dbCollections(await getDb());
  const update: Record<string, unknown> = { updated_at: new Date() };
  if (data.status != null) update.status = data.status;
  if (data.classification != null) update.classification = data.classification;
  if (data.assigned_category != null) update.assigned_category = data.assigned_category;
  if (data.assigned_account != null) update.assigned_account = data.assigned_account;
  if (data.notes != null) update.notes = data.notes;

  await c.email_notifs.updateOne({ _id: new ObjectId(id) }, { $set: update });
  revalidatePath("/notifikasi");
  return { ok: true };
}

export async function approveEmailNotifAction(
  id: string,
  entryData: {
    account_id: string;
    category: string;
    description: string;
    domain?: string;
    type?: "debit" | "credit";
  }
) {
  const c = dbCollections(await getDb());
  const notif = await c.email_notifs.findOne({ _id: new ObjectId(id) });
  if (!notif) throw new Error("Notifikasi tidak ditemukan");

  const now = new Date();
  const entry = {
    date: notif.parsed_date.toISOString().substring(0, 10),
    month: notif.parsed_date.toISOString().substring(0, 7),
    owner: "angkasa",
    account: entryData.account_id,
    direction: (entryData.type || notif.type) === "credit" ? "in" : "out",
    amount: notif.amount,
    counterparty: notif.beneficiary_name || notif.description || "",
    description: entryData.description || notif.description,
    domain: entryData.domain || "personal",
    category: entryData.category,
    source: `email:${notif.source}`,
    created_at: now,
    updated_at: now,
  };

  const result = await c.entries.insertOne(entry);

  // Determine type from direction
  const entryType = entry.direction === "out" ? "debit" : "credit";

  await c.email_notifs.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        status: "approved",
        entry_id: result.insertedId,
        assigned_account: entryData.account_id,
        assigned_category: entryData.category,
        updated_at: new Date(),
      },
    }
  );

  // Update account balance
  const account = await c.accounts.findOne({ _id: entryData.account_id });
  if (account) {
    const delta = entryType === "credit" ? entry.amount : -entry.amount;
    await c.accounts.updateOne(
      { _id: entryData.account_id },
      { $inc: { balance: delta }, $set: { updated_at: new Date() } }
    );
  }

  revalidatePath("/notifikasi");
  revalidatePath("/");
  return { ok: true, entryId: result.insertedId.toString() };
}

export async function deleteEmailNotifAction(id: string) {
  const c = dbCollections(await getDb());
  await c.email_notifs.deleteOne({ _id: new ObjectId(id) });
  revalidatePath("/notifikasi");
  return { ok: true };
}
