import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getCollections } from "@/lib/dal/context";

function ok(data: unknown) {
  return NextResponse.json(data);
}
function err(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      { _id: new ObjectId(id) },
      { $set: update }
    );

    if (result.matchedCount === 0) return err("Not found", 404);
    return ok({ success: true });
  } catch (e) {
    return err(String(e));
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const c = await getCollections();
    const result = await c.pemantauan.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) return err("Not found", 404);
    return ok({ success: true });
  } catch (e) {
    return err(String(e));
  }
}
