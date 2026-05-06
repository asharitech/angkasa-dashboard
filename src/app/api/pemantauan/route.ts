import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getCollections } from "@/lib/dal/context";

export async function GET() {
  try {
    const c = await getCollections();
    const docs = await c.pemantauan.find().sort({ holder: 1, lokasi_code: 1 }).toArray();
    return NextResponse.json(docs);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
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
    return NextResponse.json(doc, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
