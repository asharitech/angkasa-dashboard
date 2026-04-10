import { getDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    const counts = {
      accounts: await db.collection("accounts").countDocuments(),
      entries: await db.collection("entries").countDocuments(),
      obligations: await db.collection("obligations").countDocuments(),
      ledgers: await db.collection("ledgers").countDocuments(),
    };
    return Response.json({ status: "ok", db: counts });
  } catch (e) {
    return Response.json(
      { status: "error", message: (e as Error).message },
      { status: 500 }
    );
  }
}
