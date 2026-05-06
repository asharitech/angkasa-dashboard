import type { OmprengDoc } from "@/lib/ompreng-constants";
import { getCollections } from "./context";
import { serializeDates } from "./serialize";

export async function getOmprengByMonths(months: string[]): Promise<OmprengDoc[]> {
  const c = await getCollections();
  const docs = await c.ompreng
    .find({ month: { $in: months } })
    .sort({ month: 1, dapur: 1 })
    .toArray();

  return serializeDates(
    docs.map((d) => ({
      _id: d._id.toString(),
      dapur: d.dapur,
      month: d.month,
      jumlah_ompreng: d.jumlah_ompreng ?? 0,
      jumlah_sasaran: d.jumlah_sasaran ?? 0,
      kekurangan_ompreng: d.kekurangan_ompreng ?? 0,
      alasan_tambah: d.alasan_tambah ?? "",
      notes: d.notes ?? "",
      created_at: d.created_at,
      updated_at: d.updated_at,
    })),
  ) as OmprengDoc[];
}
