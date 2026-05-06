import { ok } from "@/lib/api/route-helpers";
import { getCollections } from "@/lib/dal/context";
import { DB_COLLECTION_NAMES, type DbCollectionName } from "@/lib/db/collections";
import { getDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    const c = await getCollections();
    const counts = {} as Record<DbCollectionName, number>;
    await Promise.all(
      DB_COLLECTION_NAMES.map(async (name) => {
        counts[name] = await c[name].countDocuments();
      }),
    );
    return ok({ status: "ok", db: counts });
  } catch (e) {
    return Response.json(
      { status: "error", message: (e as Error).message },
      { status: 500 },
    );
  }
}
