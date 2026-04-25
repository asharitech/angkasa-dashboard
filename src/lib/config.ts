/**
 * Application-wide constants derived from the deployment configuration.
 * All magic strings live here — pages/actions import from this file.
 *
 * When the system expands to multiple orgs, these become per-org config
 * loaded from a config collection at startup.
 */

export const ORG_ID = "yrbb" as const;

/** MongoDB account _id values for each role. */
export const ACCOUNTS = {
  operasional: "btn_yayasan",
  cash: "cash_yayasan",
  personalBri: "bri_angkasa",
  personalBca: "bca_angkasa",
} as const;

/** Valid fund source identifiers stored in obligation.sumber_dana. */
export const FUND_SOURCES = [
  "CASH_YAYASAN",
  "CASH_FAHMI",
  "CASH_PATWAR",
  "CASH_GAFFAR",
  "BRI_ANGKASA",
  "BTN_YAYASAN",
  "SEABANK_NANA",
  "DANA_SEWA",
] as const;

export type FundSource = (typeof FUND_SOURCES)[number];

/** Account domain values used in entry/account filtering. */
export const DOMAINS = {
  yayasan: "yayasan",
  personal: "personal",
} as const;

export type Domain = (typeof DOMAINS)[keyof typeof DOMAINS];

/** Valid obligation statuses. Tone mapping lives in lib/colors.ts. */
export const OBLIGATION_STATUSES = [
  "pending",
  "lunas",
  "reimbursed",
  "active",
  "settled",
  "cancelled",
] as const;

export type ObligationStatus = (typeof OBLIGATION_STATUSES)[number];
