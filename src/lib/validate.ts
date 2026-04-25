// Mirror of scripts/mongo_helper.py validators.
// Atlas free tier blocks collMod $jsonSchema, so invariants live here.
// Call validateObligation / validateEntry before insert or update operations.

import { FUND_SOURCE_VALUES } from "./names";
import { OBLIGATION_STATUSES } from "./config";
import type { ObligationFields, EntryFields, NumpangFields } from "./db/schema";

export class ValidationError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "ValidationError";
  }
}

const VALID_OBLIGATION_TYPES = new Set(["pengajuan", "loan", "recurring"]);
const VALID_OBLIGATION_STATUS = new Set<string>(OBLIGATION_STATUSES);
const VALID_ENTRY_DIRECTIONS = new Set(["in", "out"]);
const VALID_DANA_SUMBER = new Set<string | null | undefined>([
  "sewa", "operasional", null, undefined,
]);
const VALID_NUMPANG_STATUS = new Set(["active", "settled"]);
const VALID_SUMBER_DANA = new Set(FUND_SOURCE_VALUES);

function require(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new ValidationError(msg);
}

export function validateObligation(doc: ObligationFields): void {
  const t = doc.type;
  require(VALID_OBLIGATION_TYPES.has(t), `obligation.type invalid: ${t}`);

  const status = doc.status;
  if (status !== undefined) {
    require(VALID_OBLIGATION_STATUS.has(status), `obligation.status invalid: ${status}`);
  }

  if (doc.amount !== undefined && doc.amount !== null) {
    const amt = doc.amount;
    require(typeof amt === "number" && !Number.isNaN(amt), "obligation.amount must be numeric");
    require(amt >= 0, "obligation.amount must be non-negative");
  }

  if (status === "lunas" || status === "reimbursed") {
    require(doc.resolved_at != null, "resolved status requires resolved_at");
  }

  if (t === "pengajuan" && status === "pending") {
    require(doc.sumber_dana != null,
      `pengajuan pending requires sumber_dana (${[...VALID_SUMBER_DANA].join(", ")})`);
  }

  if (doc.sumber_dana != null) {
    const sd = doc.sumber_dana;
    require(VALID_SUMBER_DANA.has(sd),
      `obligation.sumber_dana invalid: ${sd}. Allowed: ${[...VALID_SUMBER_DANA].join(", ")}`);
  }
}

export function validateEntry(doc: EntryFields): void {
  const direction = doc.direction;
  require(VALID_ENTRY_DIRECTIONS.has(direction),
    `entry.direction must be 'in' or 'out', got ${direction}`);
  require(typeof doc.amount === "number" && doc.amount > 0, "entry.amount must be positive number");
  require(doc.account, "entry.account is required");
  require(doc.date, "entry.date is required");

  const danaSumber = doc.dana_sumber;
  require(VALID_DANA_SUMBER.has(danaSumber),
    `entry.dana_sumber must be 'sewa', 'operasional', or null — got ${danaSumber}`);

  if (danaSumber === "sewa" || doc.category === "sewa_masuk") {
    require(doc.tahap_sewa, "sewa-related entry requires tahap_sewa (e.g. 2026-T6)");
  }
}

export function validateNumpang(doc: NumpangFields): void {
  require(doc.description, "numpang.description required");
  require(doc.parked_in, "numpang.parked_in required (e.g. bri_angkasa)");
  const status = doc.status ?? "active";
  require(VALID_NUMPANG_STATUS.has(status), `numpang.status must be active|settled`);
  require(typeof doc.amount === "number" && doc.amount >= 0, "numpang.amount must be non-negative number");
  if (status === "active") {
    require(doc.amount > 0, "active numpang must have positive amount");
  }
}
