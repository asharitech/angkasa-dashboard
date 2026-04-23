"use server";

import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import { randomUUID } from "crypto";
import { getDb } from "@/lib/mongodb";
import { dbCollections } from "@/lib/db/collections";
import { requireAdmin, actionError } from "@/lib/auth-helpers";

type ActionResult = { ok: true; id?: string; url?: string } | { error: string };

export type DocKategori =
  | "akta"
  | "sk"
  | "surat"
  | "kontrak"
  | "laporan"
  | "perizinan"
  | "keuangan"
  | "lainnya";

const MAX_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "image/webp",
];

function r2Config() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_R2_TOKEN;
  const bucket = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (!accountId || !token || !bucket || !publicUrl)
    throw new Error("R2 environment variables are not configured");
  return { accountId, token, bucket, publicUrl };
}

async function r2Put(key: string, body: Buffer, contentType: string) {
  const { accountId, token, bucket } = r2Config();
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucket}/objects/${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": contentType },
    body: new Uint8Array(body),
  });
  if (!res.ok) throw new Error(`R2 upload failed (${res.status}): ${await res.text()}`);
}

async function r2Delete(key: string) {
  const { accountId, token, bucket } = r2Config();
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucket}/objects/${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok && res.status !== 404)
    throw new Error(`R2 delete failed (${res.status}): ${await res.text()}`);
}

function keyFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const { publicUrl } = r2Config();
  return url.startsWith(publicUrl) ? url.slice(publicUrl.length).replace(/^\//, "") : null;
}

export async function uploadDocumentAction(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const c = dbCollections(await getDb());

    const file = formData.get("file") as File | null;
    const judul = (formData.get("judul") as string)?.trim();
    const kategori = (formData.get("kategori") as DocKategori) ?? "lainnya";
    const keterangan = (formData.get("keterangan") as string)?.trim() || null;

    if (!file || !file.size) return { error: "File tidak ditemukan" };
    if (file.size > MAX_SIZE) return { error: "File terlalu besar (maks 20MB)" };
    if (!ALLOWED_TYPES.includes(file.type))
      return { error: "Format tidak didukung (PDF, Word, Excel, JPG, PNG)" };
    if (!judul) return { error: "Judul dokumen wajib diisi" };

    const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
    const docId = randomUUID();
    const key = `dokumen/${docId}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    await r2Put(key, buffer, file.type);

    const { publicUrl } = r2Config();
    const fileUrl = `${publicUrl}/${key}`;

    const now = new Date();
    const doc = {
      judul,
      kategori,
      keterangan,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      file_url: fileUrl,
      r2_key: key,
      org: "yrbb",
      owner: "angkasa",
      created_by: session.userId,
      updated_by: session.userId,
      created_at: now,
      updated_at: now,
    };

    const result = await c.documents.insertOne(doc as Parameters<typeof c.documents.insertOne>[0]);
    revalidatePath("/dokumen");
    return { ok: true, id: result.insertedId.toString(), url: fileUrl };
  } catch (err) {
    return actionError(err);
  }
}

export async function updateDocumentAction(
  id: string,
  patch: { judul?: string; kategori?: DocKategori; keterangan?: string | null },
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const c = dbCollections(await getDb());
    const existing = await c.documents.findOne({ _id: new ObjectId(id) });
    if (!existing) return { error: "Dokumen tidak ditemukan" };

    await c.documents.updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...patch, updated_by: session.userId, updated_at: new Date() } },
    );
    revalidatePath("/dokumen");
    return { ok: true };
  } catch (err) {
    return actionError(err);
  }
}

export async function deleteDocumentAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const c = dbCollections(await getDb());
    const doc = await c.documents.findOne({ _id: new ObjectId(id) });
    if (!doc) return { error: "Dokumen tidak ditemukan" };

    const key = keyFromUrl(doc.file_url as string);
    const result = await c.documents.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) return { error: "Dokumen tidak ditemukan" };

    if (key) await r2Delete(key).catch(() => void 0);

    revalidatePath("/dokumen");
    return { ok: true };
  } catch (err) {
    return actionError(err);
  }
}
