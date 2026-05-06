import type { Document, Filter } from "mongodb";
import { requireAdmin, AuthError } from "@/lib/auth-helpers";
import { fail, ok, mongoIdFilter } from "@/lib/api/route-helpers";
import { ADMIN_RAW_COLLECTION_SET } from "@/lib/admin-raw-collections";
import { getDb } from "@/lib/mongodb";

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const collectionName = searchParams.get("collection");
    const id = searchParams.get("id");

    if (!collectionName || !id) {
      return fail("Missing parameters", 400);
    }
    if (!ADMIN_RAW_COLLECTION_SET.has(collectionName)) {
      return fail("Koleksi tidak diizinkan", 400);
    }
    const db = await getDb();
    const collection = db.collection(collectionName);

    const doc = await collection.findOne(
      mongoIdFilter(id) as Filter<Document>,
    );

    if (!doc) {
      return fail("Dokumen tidak ditemukan", 404);
    }

    return ok({ doc });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return fail(err.message, err.status);
    }
    return fail(
      err instanceof Error ? err.message : "Gagal mengambil dokumen",
    );
  }
}
