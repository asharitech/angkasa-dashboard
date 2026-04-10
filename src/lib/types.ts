export interface Account {
  _id: string;
  bank: string;
  account_no: string;
  holder: string;
  type: string;
  owner: string;
  balance: number;
  balance_as_of: string;
  balance_source: string;
  meta: Record<string, string>;
}

export interface ScheduleItem {
  month: string;
  amount: number;
  status: string;
  paid_at?: string;
}

export interface DetailItem {
  item: string;
  amount: number;
}

export interface Obligation {
  _id: string;
  type: "pengajuan" | "loan" | "recurring";
  owner?: string;
  org?: string | null;
  requestor?: string;
  item: string;
  category: string;
  amount: number | null;
  month?: string | null;
  sumber_dana?: string | null;
  status: string;
  bukti_type?: string;
  bukti_ref?: string | null;
  resolved_at?: string | null;
  resolved_by?: string | null;
  resolved_via?: string | null;
  tags?: string[];
  date_spent?: string | null;
  schedule?: ScheduleItem[] | null;
  due_day?: number | string | null;
  final_month?: string | null;
  frequency?: string | null;
  is_active?: boolean;
  detail?: DetailItem[] | null;
  created_at: string;
  updated_at: string;
}

export interface LaporanOpEntry {
  no: number;
  keterangan: string;
  masuk: number;
  keluar: number;
  saldo: number;
}

export interface Ledger {
  _id: string;
  type: "laporan_op" | "balance" | "sewa" | "lembar2";
  org?: string | null;
  owner?: string | null;
  period: string;
  is_current: boolean;
  as_of: string;
  updated_at: string;
  laporan_op?: {
    entries: LaporanOpEntry[];
    totals: { masuk: number; keluar: number; saldo: number };
    kewajiban: { lembar2_btn: number; pinjaman_btn: number; total: number };
    dana_efektif: number;
  };
  balance?: {
    cash: { bca: number; bri_kas: number; total: number };
    piutang: { lembar2: number; april: number; total: number };
    numpang: Record<string, number>;
  };
  sewa?: {
    rate_per_day: number;
    locations: SewaLocation[];
    total: number;
    notes?: Record<string, string>;
  };
}

export interface SewaLocation {
  code: string;
  region: string;
  days: number | null;
  amount: number | null;
  status: "active" | "running" | "hold" | "inactive";
}

export interface Entry {
  _id: string;
  date: string;
  month: string;
  owner: string;
  account: string;
  direction: "in" | "out";
  amount: number;
  counterparty: string;
  description: string;
  domain: string;
  category: string;
  tags?: string[];
  source: string;
  ref_no?: string | null;
  created_at: string;
  updated_at: string;
}
