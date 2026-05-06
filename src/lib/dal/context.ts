import { getDb } from "@/lib/mongodb";
import { dbCollections, type DbCollections } from "@/lib/db/collections";

/** Typed Mongo access for one request — prefer this over ad-hoc `getDb()` + `dbCollections`. */
export async function getCollections(): Promise<DbCollections> {
  return dbCollections(await getDb());
}
