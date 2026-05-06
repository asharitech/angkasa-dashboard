import type { EmailNotifDoc } from "@/lib/db/schema";
import type { Filter } from "mongodb";
import { ObjectId } from "mongodb";
import { getCollections } from "./context";
import { serializeDates } from "./serialize";
import type { EmailNotif } from "./types";

export async function getEmailNotifs(opts?: {
  status?: string;
  limit?: number;
  skip?: number;
}): Promise<EmailNotif[]> {
  const c = await getCollections();
  const filter: Filter<EmailNotifDoc> = {};
  if (opts?.status) filter.status = opts.status as EmailNotifDoc["status"];
  const docs = await c.email_notifs
    .find(filter)
    .sort({ email_date: -1 })
    .limit(opts?.limit ?? 100)
    .skip(opts?.skip ?? 0)
    .toArray();
  return serializeDates(docs) as unknown as EmailNotif[];
}

export async function getEmailNotifById(id: string) {
  const c = await getCollections();
  const doc = await c.email_notifs.findOne({ _id: new ObjectId(id) });
  return doc ? serializeDates(doc) : null;
}

export async function getEmailNotifStats(): Promise<{
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  ignored: number;
}> {
  const c = await getCollections();
  const [total, pending, approved, rejected, ignored] = await Promise.all([
    c.email_notifs.countDocuments(),
    c.email_notifs.countDocuments({ status: "pending" }),
    c.email_notifs.countDocuments({ status: "approved" }),
    c.email_notifs.countDocuments({ status: "rejected" }),
    c.email_notifs.countDocuments({ status: "ignored" }),
  ]);
  return { total, pending, approved, rejected, ignored };
}
