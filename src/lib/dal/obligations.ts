import type { ObligationDoc } from "@/lib/db/schema";
import type { Obligation } from "@/lib/types";
import { ORG_ID } from "@/lib/config";
import type { Filter } from "mongodb";
import { ObjectId } from "mongodb";
import { getCollections } from "./context";

export async function getObligations(filter: Filter<ObligationDoc> = {}): Promise<Obligation[]> {
  const c = await getCollections();
  return c.obligations.find(filter).sort({ month: 1, created_at: -1 }).toArray();
}

export async function getObligationById(id: string): Promise<Obligation | null> {
  const c = await getCollections();
  return c.obligations.findOne({ _id: new ObjectId(id) });
}

export async function getWajibBulanan(): Promise<Obligation[]> {
  const c = await getCollections();
  return c.obligations
    .find({ type: "recurring", org: ORG_ID })
    .sort({ category: 1, created_at: -1 })
    .toArray();
}
