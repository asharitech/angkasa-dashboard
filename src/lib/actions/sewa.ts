"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/mongodb";
import { dbCollections } from "@/lib/db/collections";
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
    const c = dbCollections(await getDb());
    const ledger = await c.ledgers.findOne({ type: "sewa", is_current: true });
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

    await c.ledgers.updateOne(
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
