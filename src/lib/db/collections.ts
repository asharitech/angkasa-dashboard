import type { Db } from "mongodb";
import type {
  AccountDoc,
  AgendaFields,
  DocumentFields,
  EntryFields,
  LedgerFields,
  NumpangFields,
  ObligationFields,
  OmprengFields,
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
  } as const;
}

export type DbCollections = ReturnType<typeof dbCollections>;
