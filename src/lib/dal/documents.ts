import type { DocumentListItem } from "./types";
import { getCollections } from "./context";
import { serializeDates } from "./serialize";

export async function getDocumentsForOrg(org: string): Promise<DocumentListItem[]> {
  const c = await getCollections();
  const docs = await c.documents.find({ org }).sort({ created_at: -1 }).toArray();

  return serializeDates(
    docs.map((d) => ({
      _id: d._id.toString(),
      judul: d.judul,
      kategori: d.kategori as DocumentListItem["kategori"],
      keterangan: d.keterangan ?? null,
      file_name: d.file_name,
      file_type: d.file_type,
      file_size: d.file_size,
      file_url: d.file_url,
      created_at: d.created_at,
      updated_at: d.updated_at,
    })),
  ) as DocumentListItem[];
}
