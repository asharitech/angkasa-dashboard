"use server";

import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireAdmin, actionError } from "@/lib/auth-helpers";
import { ADMIN_RAW_COLLECTION_SET } from "@/lib/admin-raw-collections";

function assertAllowedCollection(name: string): string | null {
  if (!ADMIN_RAW_COLLECTION_SET.has(name)) return "Koleksi tidak diizinkan";
  return null;
}

export async function updateRawDocumentAction(
  collectionName: string,
  id: string,
  data: Record<string, unknown>
): Promise<{ ok?: boolean; error?: string }> {
  try {
    await requireAdmin();
    const bad = assertAllowedCollection(collectionName);
    if (bad) return { error: bad };
    const db = await getDb();
    const collection = db.collection<{ _id: ObjectId | string }>(collectionName);

    // Remove _id from data if present to avoid Mongo error
    const { _id: _stripId, ...updateData } = data;

    const idFilter = {
      _id: id.length === 24 ? new ObjectId(id) : id,
    };

    const result = await collection.updateOne(idFilter, {
      $set: { ...updateData, updated_at: new Date() },
    });

    if (result.matchedCount === 0) {
      return { error: "Dokumen tidak ditemukan" };
    }

    revalidatePath("/", "layout");
    return { ok: true };
  } catch (err) {
    return actionError(err);
  }
}

export async function deleteRawDocumentAction(
  collectionName: string,
  id: string
): Promise<{ ok?: boolean; error?: string }> {
  try {
    await requireAdmin();
    const bad = assertAllowedCollection(collectionName);
    if (bad) return { error: bad };
    const db = await getDb();
    const collection = db.collection<{ _id: ObjectId | string }>(collectionName);

    const idFilter = {
      _id: id.length === 24 ? new ObjectId(id) : id,
    };
    const result = await collection.deleteOne(idFilter);

    if (result.deletedCount === 0) {
      return { error: "Dokumen tidak ditemukan" };
    }

    revalidatePath("/", "layout");
    return { ok: true };
  } catch (err) {
    return actionError(err);
  }
}
