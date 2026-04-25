/**
 * Sewa display metadata: pipeline stages, region tones, and location reference table.
 * Centralized here so sewa/page.tsx and any future sewa components share one definition.
 *
 * When the DB gains a new region or pipeline stage, add it here — no need to hunt
 * through page files. Unknown stages/regions get safe neutral fallbacks.
 */

import type { Tone } from "@/lib/colors";

export interface SewaStageMeta {
  label: string;
  tone: Tone;
}

/** Maps pipeline stage keys → display metadata. Unknown keys fall back to neutral. */
export const SEWA_STAGE_META: Record<string, SewaStageMeta> = {
  belum_diterima: { label: "Belum Diterima", tone: "danger" },
  di_intermediate: { label: "Di Intermediate", tone: "warning" },
  transfer_yayasan: { label: "Transfer ke Yayasan", tone: "info" },
  tercatat: { label: "Tercatat", tone: "success" },
};

export const SEWA_STAGE_FALLBACK: SewaStageMeta = { label: "—", tone: "neutral" };

export function getSewaStageMeta(stage: string | undefined | null): SewaStageMeta | null {
  if (!stage) return null;
  return SEWA_STAGE_META[stage] ?? { label: stage, tone: "neutral" };
}

/** Maps region names → display tone. Unknown regions fall back to neutral. */
export const SEWA_REGION_TONE: Record<string, Tone> = {
  TOPILAUT: "info",
  "Rangas Beach": "warning",
  ANGKASA: "success",
};

export function getRegionTone(region: string): Tone {
  return SEWA_REGION_TONE[region] ?? "neutral";
}

/** Reference metadata for each sewa location code. */
export interface SewaLocationRef {
  code: string;
  bgn: string;
  name: string;
  region: string;
  holder: string;
}

export const SEWA_LOCATION_REFS: SewaLocationRef[] = [
  { code: "SIMBORO",      bgn: "RB",  name: "Simboro",       region: "TOPILAUT",     holder: "Patta Wellang" },
  { code: "DIPO",         bgn: "DP",  name: "Dipo",          region: "TOPILAUT",     holder: "Patta Wellang" },
  { code: "KURBAS",       bgn: "KB",  name: "Kurbas",        region: "TOPILAUT",     holder: "Patta Wellang" },
  { code: "TAPALANG",     bgn: "TPL", name: "Tapalang",      region: "TOPILAUT",     holder: "Patta Wellang" },
  { code: "KENJE",        bgn: "CL",  name: "Kenje",         region: "TOPILAUT",     holder: "Patta Wellang" },
  { code: "SARUDU",       bgn: "SRD", name: "Sarudu",        region: "Rangas Beach", holder: "Pak Sandi" },
  { code: "BUDONG_BUDONG",bgn: "BDG", name: "Budong-Budong", region: "Rangas Beach", holder: "Pak Sandi" },
  { code: "SAMPAGA",      bgn: "SPG", name: "Sampaga",       region: "Rangas Beach", holder: "Pak Sandi" },
  { code: "KAROSSA",      bgn: "KRS", name: "Karossa",       region: "Rangas Beach", holder: "Pak Sandi" },
  { code: "LARA",         bgn: "LR",  name: "Lara",          region: "ANGKASA",      holder: "—" },
  { code: "SUMARE",       bgn: "SMR", name: "Sumare",        region: "ANGKASA",      holder: "—" },
];

/** Lookup by code — returns undefined for unknown codes (they still display from DB data). */
export const SEWA_LOCATION_REF_MAP = new Map(
  SEWA_LOCATION_REFS.map((l) => [l.code, l]),
);
