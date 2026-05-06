/** Collections allowed for Master Data raw fetch/update/delete (must match admin UI). */
export const ADMIN_RAW_COLLECTIONS = [
  "accounts",
  "entries",
  "obligations",
  "ledgers",
  "numpang",
  "agenda",
  "users",
] as const;

export type AdminRawCollection = (typeof ADMIN_RAW_COLLECTIONS)[number];

export const ADMIN_RAW_COLLECTION_SET = new Set<string>(ADMIN_RAW_COLLECTIONS);
