import type { Db } from "mongodb";
import type {
  AccountDoc,
  AgendaDoc,
  DocumentDoc,
  EntryFields,
  LedgerDoc,
  NumpangFields,
  ObligationDoc,
  OmprengDoc,
  UserFields,
} from "./schema";

/**
 * Typed MongoDB collection accessors. Use with getDb():
 * `const c = dbCollections(await getDb()); c.entries.find(...)`
 */
export function dbCollections(db: Db) {
  return {
    accounts: db.collection<AccountDoc>("accounts"),
    entries: db.collection<EntryFields>("entries"),
    obligations: db.collection<ObligationDoc>("obligations"),
    ledgers: db.collection<LedgerDoc>("ledgers"),
    numpang: db.collection<NumpangFields>("numpang"),
    users: db.collection<UserFields>("users"),
    agenda: db.collection<AgendaDoc>("agenda"),
    documents: db.collection<DocumentDoc>("documents"),
    ompreng: db.collection<OmprengDoc>("ompreng"),
  } as const;
}

export type DbCollections = ReturnType<typeof dbCollections>;
