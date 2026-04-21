// Shared constants & types for ompreng feature
// Not a server action file — can be imported anywhere

export const DAPUR_LOCATIONS = [
  "SIMBORO",
  "DIPO",
  "KURBAS",
  "TAPALANG",
  "KENJE",
  "SARUDU",
  "BUDONG_BUDONG",
  "SAMPAGA",
  "KAROSSA",
  "LARA",
  "SUMARE",
] as const;

export type DapurLocation = (typeof DAPUR_LOCATIONS)[number];

export const DAPUR_LABELS: Record<DapurLocation, string> = {
  SIMBORO: "Simboro",
  DIPO: "Dipo",
  KURBAS: "Kurbas",
  TAPALANG: "Tapalang",
  KENJE: "Kenje",
  SARUDU: "Sarudu",
  BUDONG_BUDONG: "Budong-Budong",
  SAMPAGA: "Sampaga",
  KAROSSA: "Karossa",
  LARA: "Lara",
  SUMARE: "Sumare",
};

export interface OmprengDoc {
  _id?: string;
  dapur: DapurLocation;
  month: string; // YYYY-MM
  jumlah_ompreng: number;
  jumlah_sasaran: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}
