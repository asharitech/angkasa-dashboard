import type { PemantauanDoc } from "@/lib/db/schema";
import { getCollections } from "./context";

export async function getPemantauan(): Promise<PemantauanDoc[]> {
  const c = await getCollections();
  return c.pemantauan.find().sort({ holder: 1, lokasi_code: 1 }).toArray();
}
