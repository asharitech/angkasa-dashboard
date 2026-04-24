"use server";

import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { dbCollections } from "@/lib/db/collections";
import { validateNumpang } from "@/lib/validate";
import { requireAdmin, actionError } from "@/lib/auth-helpers";

type ActionResult = { ok: true; id?: string } | { error: string };

function toObjectId(id: string): ObjectId {
  return new ObjectId(id);
}

export interface NumpangInput {
  description: string;
  amount: number;
  parked_in: string;
  status?: "active" | "settled";
  notes?: string;
}

export async function createNumpangAction(input: NumpangInput): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const c = dbCollections(await getDb());
    const now = new Date();
    const doc: Record<string, unknown> = {
      description: input.description.trim(),
      amount: input.amount,
      parked_in: input.parked_in,
      status: input.status ?? "active",
      notes: input.notes?.trim() || null,
      created_by: session.userId,
      updated_by: session.userId,
      created_at: now,
      updated_at: now,
    };
    validateNumpang(doc);
    const result = await c.numpang.insertOne(doc as unknown as import("@/lib/db/schema").NumpangFields);
    revalidatePath("/pribadi");
    revalidatePath("/");
    return { ok: true, id: result.insertedId.toString() };
  } catch (err) {
    return actionError(err);
  }
}

export async function updateNumpangAction(
  id: string,
  patch: Partial<NumpangInput>,
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const c = dbCollections(await getDb());
    const existing = await c.numpang.findOne({ _id: toObjectId(id) });
    if (!existing) return { error: "Numpang tidak ditemukan" };
    const merged = { ...existing, ...patch };
    validateNumpang(merged);
    await c.numpang.updateOne(
      { _id: toObjectId(id) },
      {
        $set: {
          ...patch,
          updated_by: session.userId,
          updated_at: new Date(),
        },
      },
    );
    revalidatePath("/pribadi");
    return { ok: true };
  } catch (err) {
    return actionError(err);
  }
}

export async function settleNumpangAction(id: string): Promise<ActionResult> {
  return updateNumpangAction(id, { status: "settled" });
}

export async function deleteNumpangAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const c = dbCollections(await getDb());
    const result = await c.numpang.deleteOne({ _id: toObjectId(id) });
    if (result.deletedCount === 0) return { error: "Numpang tidak ditemukan" };
    revalidatePath("/pribadi");
    return { ok: true };
  } catch (err) {
    return actionError(err);
  }
}
