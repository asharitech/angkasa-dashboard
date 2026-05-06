import type { BudgetConfigDoc } from "@/lib/db/schema";
import type { Entry, Obligation } from "@/lib/types";

export interface LaporanOpReconciliation {
  ledgerMasuk: number;
  ledgerKeluar: number;
  entriesMasuk: number;
  entriesKeluar: number;
  diffMasuk: number;
  diffKeluar: number;
  account: string;
  asOf?: string;
}

export interface DuplicateGroup {
  key: string;
  date: string;
  amount: number;
  entries: Entry[];
}

export interface DuplicateObligation {
  amount: number;
  obligations: Obligation[];
}

export interface DataQualityReport {
  duplicateObligations: DuplicateObligation[];
  missingFields: Record<string, number>;
  totalObligations: number;
  duplicateCount: number;
  missingFieldCount: number;
}

export interface BudgetSummary {
  config: BudgetConfigDoc;
  bcaBalance: number;
  briKas: number;
  totalSaldo: number;
  month: string;
  actualSpending: Record<string, number>;
  spendingDetails: Record<string, Entry[]>;
  loanTotalThisMonth: number;
  loanPaidThisMonth: number;
  recurringTotalThisMonth: number;
  fixedDeductionsTotal: number;
  netAvailable: number;
  totalBudgeted: number;
  totalRemainingBudget: number;
}

export type EmailNotif = {
  _id: string;
  source: string;
  email_subject: string;
  email_date: string;
  parsed_date: string;
  amount: number;
  fee?: number;
  total?: number;
  currency: string;
  type: string;
  transfer_method?: string;
  beneficiary_name?: string;
  beneficiary_bank?: string;
  beneficiary_account?: string;
  source_account?: string;
  reference_no?: string;
  description: string;
  /** Plain excerpt from email body for review (may be HTML stripped server-side or by agent). */
  raw_body?: string;
  status: string;
  classification?: string;
  assigned_category?: string;
  assigned_account?: string;
  assigned_obligation_id?: string;
  entry_id?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  reviewed_by?: string;
  reviewed_at?: string;
};

export interface UserListRow {
  _id: string;
  username: string;
  name: string;
  role: "admin" | "viewer";
  phone?: string;
  created_at: string;
}

export interface AgendaListItem {
  _id: string;
  title: string;
  description?: string | null;
  due_date: string;
  priority: "tinggi" | "sedang" | "rendah";
  kategori?: string;
  status: "belum" | "selesai";
  tags?: string[];
  completed_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface DocumentListItem {
  _id: string;
  judul: string;
  kategori:
    | "akta"
    | "sk"
    | "surat"
    | "kontrak"
    | "laporan"
    | "perizinan"
    | "keuangan"
    | "lainnya";
  keterangan?: string | null;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  created_at: string;
  updated_at?: string;
}
