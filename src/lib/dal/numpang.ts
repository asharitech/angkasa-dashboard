import type { Numpang } from "@/lib/types";
import { getCollections } from "./context";

export async function getNumpang(): Promise<Numpang[]> {
  const c = await getCollections();
  return c.numpang.find({}).sort({ amount: -1 }).toArray();
}

export async function getNumpangActive(): Promise<Numpang[]> {
  const c = await getCollections();
  return c.numpang.find({ status: "active" }).sort({ amount: -1 }).toArray();
}
