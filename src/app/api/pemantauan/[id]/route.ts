import type { NextRequest } from "next/server";
import { getCollections } from "@/lib/dal/context";
import { fail, ok, parseObjectId } from "@/lib/api/route-helpers";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const objectId = parseObjectId(id);
    if (!objectId) return fail("ID tidak valid", 400);
    const body = await req.json();
    const c = await getCollections();

    const update: Record<string, unknown> = {
      updated_at: new Date(),
    };
    if (body.temuan !== undefined) update.temuan = body.temuan;
    if (body.tanggal_pemantauan !== undefined) update.tanggal_pemantauan = body.tanggal_pemantauan;
    if (body.status_keseluruhan !== undefined) update.status_keseluruhan = body.status_keseluruhan;
    if (body.kolom_belum !== undefined) update.kolom_belum = body.kolom_belum;
    if (body.notes !== undefined) update.notes = body.notes;

    const result = await c.pemantauan.updateOne(
      { _id: objectId },
      { $set: update }
    );

    if (result.matchedCount === 0) return fail("Not found", 404);
    return ok({ success: true });
  } catch (e) {
    return fail(String(e));
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const objectId = parseObjectId(id);
    if (!objectId) return fail("ID tidak valid", 400);
    const c = await getCollections();
    const result = await c.pemantauan.deleteOne({ _id: objectId });
    if (result.deletedCount === 0) return fail("Not found", 404);
    return ok({ success: true });
  } catch (e) {
    return fail(String(e));
  }
}
