/**
 * Application-facing type aliases for Mongo documents and views.
 * Canonical field definitions live in `./db/schema.ts`.
 */
export type {
  AccountDoc as Account,
  ScheduleItemDoc as ScheduleItem,
  DetailItemDoc as DetailItem,
  ObligationDoc as Obligation,
  LaporanOpEntryDoc as LaporanOpEntry,
  LedgerDoc as Ledger,
  SewaPipelineStage,
  SewaPipelineDoc as SewaPipeline,
  SewaLocationDoc as SewaLocation,
  EntryDoc as Entry,
  NumpangDoc as Numpang,
  DataIntegrityIssue,
  ActivityEvent,
} from "./db/schema";
