"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/mongodb";
import { requireAdmin, actionError } from "@/lib/auth-helpers";
import type { SewaLocation, SewaPipelineStage } from "@/lib/types";

type ActionResult = { ok: true } | { error: string };

const VALID_STAGES: SewaPipelineStage[] = [
  "belum_diterima",
  "di_intermediate",
  "transfer_yayasan",
  "tercatat",
];
const VALID_STATUS = ["active", "running", "hold", "inactive"] as const;

export interface SewaLocationPatch {
  days?: number | null;
  amount?: number | null;
  status?: (typeof VALID_STATUS)[number];
  pipeline?: {
    stage: SewaPipelineStage;
    holder?: string | null;
    expected_amount?: number | null;
    received_at?: string | null;
    notes?: string | null;
  } | null;
}

export async function updateSewaLocationAction(
  code: string,
  patch: SewaLocationPatch,
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const db = await getDb();
    const ledger = await db
      .collection("ledgers")
      .findOne({ type: "sewa", is_current: true });
    if (!ledger) return { error: "Ledger sewa aktif tidak ditemukan" };

    const locations: SewaLocation[] = ledger.sewa?.locations ?? [];
    const idx = locations.findIndex((l) => l.code === code);
    if (idx < 0) return { error: `Lokasi ${code} tidak ditemukan` };

    if (patch.status && !VALID_STATUS.includes(patch.status)) {
      return { error: "Status tidak valid" };
    }
    if (patch.pipeline && !VALID_STAGES.includes(patch.pipeline.stage)) {
      return { error: "Tahap pipeline tidak valid" };
    }

    const current = locations[idx];
    const next: SewaLocation = {
      ...current,
      ...(patch.days !== undefined ? { days: patch.days } : {}),
      ...(patch.amount !== undefined ? { amount: patch.amount } : {}),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.pipeline !== undefined
        ? {
            pipeline: patch.pipeline
              ? {
                  stage: patch.pipeline.stage,
                  holder: patch.pipeline.holder ?? null,
                  expected_amount: patch.pipeline.expected_amount ?? null,
                  received_at: patch.pipeline.received_at ?? null,
                  notes: patch.pipeline.notes ?? null,
                }
              : null,
          }
        : {}),
    };

    const nextLocations = [...locations];
    nextLocations[idx] = next;
    const nextTotal = nextLocations.reduce((s, l) => s + (l.amount ?? 0), 0);

    await db.collection("ledgers").updateOne(
      { _id: ledger._id },
      {
        $set: {
          "sewa.locations": nextLocations,
          "sewa.total": nextTotal,
          updated_at: new Date(),
          updated_by: session.userId,
        },
      },
    );

    revalidatePath("/sewa");
    revalidatePath("/");
    return { ok: true };
  } catch (err) {
    return actionError(err);
  }
}

export async function startNewSewaPeriodAction(): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const db = await getDb();
    
    const currentLedger = await db
      .collection("ledgers")
      .findOne({ type: "sewa", is_current: true });
      
    if (!currentLedger) return { error: "Ledger sewa aktif tidak ditemukan" };
    
    // Archive current ledger
    await db.collection("ledgers").updateOne(
      { _id: currentLedger._id },
      { $set: { is_current: false } }
    );
    
    // Create new period code
    const now = new Date();
    const periodCode = `SEWA_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}_${Math.floor(Math.random() * 1000)}`;
    const [startYear, startMonth] = (currentLedger.period || "").split(" - ")[1]?.split("/") || [now.getFullYear().toString(), (now.getMonth() + 1).toString()];
    
    const newLedger = {
      ...currentLedger,
      _id: undefined,
      period: `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()} - ${now.getDate()}/${now.getMonth() + 2}/${now.getFullYear()}`,
      period_code: periodCode,
      is_current: true,
      as_of: now.toISOString(),
      updated_at: now,
      updated_by: session.userId,
      sewa: {
        ...currentLedger.sewa,
        locations: currentLedger.sewa.locations.map((loc: any) => ({
          ...loc,
          pipeline: {
            stage: "belum_diterima",
            holder: null,
            expected_amount: loc.amount,
            received_at: null,
            notes: null
          }
        }))
      }
    };
    
    await db.collection("ledgers").insertOne(newLedger);
    
    revalidatePath("/sewa");
    return { ok: true };
  } catch (err) {
    return actionError(err);
  }
}
