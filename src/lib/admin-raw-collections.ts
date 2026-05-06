import { DB_COLLECTION_NAMES } from "@/lib/db/collections";

/**
 * Collections allowed for Master Data raw fetch/update/delete in `/admin`.
 * Mirrors `DB_COLLECTION_NAMES` / `dbCollections()` — do not diverge.
 */
export const ADMIN_RAW_COLLECTIONS = DB_COLLECTION_NAMES;

export type AdminRawCollection = (typeof ADMIN_RAW_COLLECTIONS)[number];

export const ADMIN_RAW_COLLECTION_SET = new Set<string>(ADMIN_RAW_COLLECTIONS);
