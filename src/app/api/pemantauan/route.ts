import type { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getCollections } from "@/lib/dal/context";
import { fail, ok } from "@/lib/api/route-helpers";

export async function GET() {
  try {
    const c = await getCollections();
    const docs = await c.pemantauan.find().sort({ holder: 1, lokasi_code: 1 }).toArray();
    return ok(docs);
  } catch (err) {
    return fail(String(err));
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const c = await getCollections();

    const doc = {
      ...body,
      _id: new ObjectId(),
      created_at: new Date(),
      updated_at: new Date(),
    };

    await c.pemantauan.insertOne(doc);
    return ok(doc, 201);
  } catch (err) {
    return fail(String(err));
  }
}
