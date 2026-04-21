"use server";

import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireAdmin, actionError } from "@/lib/auth-helpers";
import type { DapurLocation } from "@/lib/ompreng-constants";

type ActionResult = { ok: true; id?: string } | { error: string };

export async function upsertOmpreng(data: {
  dapur: DapurLocation;
  month: string;
  jumlah_ompreng: number;
  jumlah_sasaran: number;
  kekurangan_ompreng?: number;
  alasan_tambah?: string;
  notes?: string;
}): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch {
    return actionError("Unauthorized");
  }
  const db = await getDb();
  const now = new Date().toISOString();
  await db.collection("ompreng").updateOne(
    { dapur: data.dapur, month: data.month },
    {
      $set: {
        jumlah_ompreng: data.jumlah_ompreng,
        jumlah_sasaran: data.jumlah_sasaran,
        kekurangan_ompreng: data.kekurangan_ompreng ?? 0,
        alasan_tambah: data.alasan_tambah ?? "",
        notes: data.notes ?? "",
        updated_at: now,
      },
      $setOnInsert: { created_at: now },
    },
    { upsert: true }
  );
  revalidatePath("/ompreng");
  return { ok: true };
}

export async function deleteOmpreng(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch {
    return actionError("Unauthorized");
  }
  const db = await getDb();
  await db.collection("ompreng").deleteOne({ _id: new ObjectId(id) });
  revalidatePath("/ompreng");
  return { ok: true };
}
