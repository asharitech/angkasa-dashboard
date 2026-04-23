/**
 * Single source of truth for MongoDB document shapes (agent-asharitech-angkasa).
 * Derived from live collection sampling (scripts/introspect_mongo_schema.py) plus
 * fields only present on subsets of documents (see comments).
 */
import type { ObjectId } from "mongodb";

/** Timestamps may be BSON Date in DB or ISO strings after serializeDates / JSON. */
export type DbDate = Date | string;

export type AccountId = string;

/** accounts — _id is string (e.g. bri_angkasa, cash_yayasan) */
export interface AccountDoc {
  _id: AccountId;
  bank: string;
  account_no: string;
  holder: string;
  type: string;
  owner: string;
  balance: number;
  balance_as_of: string;
  balance_source: string;
  meta: Record<string, string | number | undefined>;
  last_correction?: string;
  created_at: DbDate;
  updated_at: DbDate;
}

export type EntryDirection = "in" | "out";

export interface EntryBankDetail {
  balance_after?: number | null;
  fee?: number;
  raw_description?: string;
}

/** entries */
export interface EntryDoc {
  _id: ObjectId;
  date: string;
  month: string;
  owner: string;
  account: string;
  direction: EntryDirection | string;
  amount: number;
  counterparty: string;
  description: string;
  domain: string;
  category: string;
  tags?: string[];
  source: string;
  ref_no?: string | null;
  /** Yayasan pool tagging; not always present in older rows */
  dana_sumber?: "sewa" | "operasional" | null;
  tahap_sewa?: string | null;
  obligation_id?: ObjectId | string | null;
  bank_detail?: EntryBankDetail | null;
  created_at: DbDate;
  updated_at: DbDate;
}

export type ObligationType = "pengajuan" | "loan" | "recurring" | string;

export interface ScheduleItemDoc {
  month: string;
  amount: number;
  status: string;
  paid_at?: string;
}

export interface DetailItemDoc {
  item: string;
  amount: number;
}

/** obligations */
export interface ObligationDoc {
  _id: ObjectId;
  type: ObligationType;
  owner?: string;
  org?: string | null;
  requestor?: string | null;
  item: string;
  category: string;
  amount: number | null;
  month?: string | null;
  sumber_dana?: string | null;
  status: string;
  bukti_type?: string;
  bukti_ref?: string | null;
  bukti_url?: string | null;
  description?: string | null;
  resolved_at?: DbDate | null;
  resolved_by?: string | null;
  resolved_via?: string | null;
  resolved_entry_id?: ObjectId;
  tags?: string[];
  date_spent?: string | null;
  schedule?: ScheduleItemDoc[] | null;
  due_day?: number | string | null;
  reminder_days?: number | null;
  final_month?: string | null;
  frequency?: string | null;
  is_active?: boolean;
  detail?: DetailItemDoc[] | null;
  /** Audit / recovery (subset of docs) */
  audit_flag?: string;
  audit_flagged_at?: DbDate;
  audit_note?: string;
  recovery_note?: string;
  updated_by?: string;
  created_at: DbDate;
  updated_at: DbDate;
}

export interface LaporanOpEntryDoc {
  no: number;
  keterangan: string;
  masuk: number;
  keluar: number;
  saldo: number;
}

export interface LaporanOpKewajibanDoc {
  dana_pinjam_angkasa_tahap1?: number;
  dana_pinjam_angkasa_tahap2?: number;
  dana_pinjam_angkasa_tahap3?: number;
  dana_pinjam_angkasa_tahap4?: number;
  lembar2_btn?: number;
  pinjaman_btn?: number;
  pinjaman_btn_awal?: number;
  pinjaman_btn_sumare?: number;
  total: number;
}

export interface LaporanOpPayloadDoc {
  entries: LaporanOpEntryDoc[];
  totals: { masuk: number; keluar: number; saldo: number };
  kewajiban: LaporanOpKewajibanDoc;
  dana_efektif: number;
}

export type SewaPipelineStage =
  | "belum_diterima"
  | "di_intermediate"
  | "transfer_yayasan"
  | "tercatat";

export interface SewaPipelineDoc {
  stage: SewaPipelineStage;
  holder?: string | null;
  expected_amount?: number | null;
  received_at?: string | null;
  notes?: string | null;
}

export interface SewaLocationDoc {
  code: string;
  region: string;
  days: number | null;
  amount: number | null;
  status: "active" | "running" | "hold" | "inactive" | string;
  pipeline?: SewaPipelineDoc | null;
}

export interface SewaPayloadDoc {
  rate_per_day: number;
  locations: SewaLocationDoc[];
  total: number;
  notes?: Record<string, string>;
  label?: string;
  tahap?: number;
}

export interface BalancePayloadDoc {
  cash: { bca: number; bri_kas: number; total: number };
  piutang: Record<string, number> & { total: number };
  numpang: Record<string, number> & { total?: number };
}

export type LedgerType =
  | "laporan_op"
  | "balance"
  | "balance_archived"
  | "sewa"
  | "lembar2"
  | string;

/** ledgers */
export interface LedgerDoc {
  _id: ObjectId;
  type: LedgerType;
  org?: string | null;
  owner?: string | null;
  period: string;
  period_code?: string | null;
  is_current: boolean;
  as_of: DbDate;
  updated_at: DbDate;
  created_at?: DbDate;
  note?: string;
  reported_by?: string;
  archived_at?: DbDate;
  laporan_op?: LaporanOpPayloadDoc;
  balance?: BalancePayloadDoc;
  sewa?: SewaPayloadDoc;
}

/** numpang — _id may be ObjectId or string in older data; dashboard uses string */
export interface NumpangHistoryEventDoc {
  date: string;
  amount: number;
  event: string;
  ref: string;
}

export interface NumpangDoc {
  _id: ObjectId | string;
  description: string;
  amount: number;
  parked_in: string;
  status: "active" | "settled" | string;
  notes?: string;
  source?: string;
  history?: NumpangHistoryEventDoc[];
  created_at?: DbDate;
  updated_at?: DbDate;
}

/** users */
export interface UserDoc {
  _id: ObjectId;
  username: string;
  name: string;
  role: string;
  phone?: string | null;
  password_hash: string;
  created_at: DbDate;
  updated_at: DbDate;
}

export type AgendaPriority = "tinggi" | "sedang" | "rendah" | string;
export type AgendaStatus = "belum" | "selesai" | string;

/** agenda */
export interface AgendaDoc {
  _id: ObjectId;
  title: string;
  description?: string | null;
  due_date: string;
  priority: AgendaPriority;
  kategori: string;
  status: AgendaStatus;
  tags: string[];
  reminder_at?: string | null;
  owner: string;
  created_by: string;
  updated_by: string;
  completed_at?: DbDate | null;
  created_at: DbDate;
  updated_at: DbDate;
}

/** documents (may be empty collection in dev — shape from insert path) */
export interface DocumentDoc {
  _id: ObjectId;
  judul: string;
  kategori: string;
  keterangan?: string | null;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  r2_key: string;
  org: string;
  owner: string;
  created_by: string;
  updated_by: string;
  created_at: DbDate;
  updated_at: DbDate;
}

/** ompreng — some date fields stored as strings historically */
export interface OmprengDoc {
  _id: ObjectId;
  dapur: string;
  month: string;
  jumlah_ompreng: number;
  jumlah_sasaran: number;
  kekurangan_ompreng?: number;
  alasan_tambah?: string;
  notes?: string;
  created_at: DbDate | string;
  updated_at: DbDate | string;
}

/** API / integrity helpers (not a collection) */
export interface DataIntegrityIssue {
  kind: string;
  severity: "info" | "warn" | "error";
  message: string;
  entity_id?: string;
  hint?: string;
}

export interface ActivityEvent {
  _id: string;
  type: "entry" | "obligation";
  date: string;
  title: string;
  subtitle: string;
  amount: number | null;
  direction?: EntryDirection;
  status?: string;
  domain?: string;
  category?: string;
  created_at: string;
}
