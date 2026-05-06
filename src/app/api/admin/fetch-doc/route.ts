import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireAdmin, AuthError } from "@/lib/auth-helpers";
import { ADMIN_RAW_COLLECTION_SET } from "@/lib/admin-raw-collections";
import { getDb } from "@/lib/mongodb";

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const collectionName = searchParams.get("collection");
    const id = searchParams.get("id");

    if (!collectionName || !id) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }
    if (!ADMIN_RAW_COLLECTION_SET.has(collectionName)) {
      return NextResponse.json({ error: "Koleksi tidak diizinkan" }, { status: 400 });
    }
    const db = await getDb();
    const collection = db.collection<{ _id: ObjectId | string }>(collectionName);

    const idFilter = {
      _id: id.length === 24 ? new ObjectId(id) : id,
    };
    const doc = await collection.findOne(idFilter);

    if (!doc) {
      return NextResponse.json({ error: "Dokumen tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ doc });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal mengambil dokumen" },
      { status: 500 }
    );
  }
}
