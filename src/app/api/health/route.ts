import { getCollections } from "@/lib/dal/context";
import { getDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    const c = await getCollections();
    const counts = {
      accounts: await c.accounts.countDocuments(),
      entries: await c.entries.countDocuments(),
      obligations: await c.obligations.countDocuments(),
      ledgers: await c.ledgers.countDocuments(),
    };
    return Response.json({ status: "ok", db: counts });
  } catch (e) {
    return Response.json(
      { status: "error", message: (e as Error).message },
      { status: 500 }
    );
  }
}
