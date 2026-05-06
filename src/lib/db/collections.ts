import type { Db } from "mongodb";
import type {
  AccountDoc,
  AgendaFields,
  BudgetConfigDoc,
  DocumentFields,
  EmailNotifFields,
  EntryFields,
  LedgerFields,
  NumpangFields,
  ObligationFields,
  OmprengFields,
  PemantauanFields,
  UserFields,
} from "./schema";

/**
 * Typed MongoDB collection accessors. Use with getDb():
 * `const c = dbCollections(await getDb()); c.entries.find(...)`
 *
 * Collections use fields types (without _id) so insertOne doesn't require _id.
 * find/findOne return WithId<TFields> which is structurally identical to *Doc.
 */
export function dbCollections(db: Db) {
  return {
    accounts: db.collection<AccountDoc>("accounts"),
    entries: db.collection<EntryFields>("entries"),
    obligations: db.collection<ObligationFields>("obligations"),
    ledgers: db.collection<LedgerFields>("ledgers"),
    numpang: db.collection<NumpangFields>("numpang"),
    users: db.collection<UserFields>("users"),
    agenda: db.collection<AgendaFields>("agenda"),
    documents: db.collection<DocumentFields>("documents"),
    ompreng: db.collection<OmprengFields>("ompreng"),
    pemantauan: db.collection<PemantauanFields>("pemantauan"),
    budget_configs: db.collection<BudgetConfigDoc>("budget_configs"),
    email_notifs: db.collection<EmailNotifFields>("email_notifs"),
  } as const;
}

export type DbCollections = ReturnType<typeof dbCollections>;

/**
 * Ordered physical collection names — must match every key on `DbCollections`.
 * Use for health probes, admin allowlists, docs.
 */
export const DB_COLLECTION_NAMES = [
  "accounts",
  "entries",
  "obligations",
  "ledgers",
  "numpang",
  "users",
  "agenda",
  "documents",
  "ompreng",
  "pemantauan",
  "budget_configs",
  "email_notifs",
] as const satisfies ReadonlyArray<keyof DbCollections>;

export type DbCollectionName = (typeof DB_COLLECTION_NAMES)[number];
