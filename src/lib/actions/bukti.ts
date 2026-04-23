"use server";

import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import { randomUUID } from "crypto";
import { getDb } from "@/lib/mongodb";
import { dbCollections } from "@/lib/db/collections";
import { requireAdmin, actionError } from "@/lib/auth-helpers";

type ActionResult = { ok: true; url?: string } | { error: string };

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];

function r2Config() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_R2_TOKEN;
  const bucket = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (!accountId || !token || !bucket || !publicUrl) {
    throw new Error("R2 environment variables are not configured");
  }
  return { accountId, token, bucket, publicUrl };
}

async function r2PutObject(key: string, body: Buffer, contentType: string) {
  const { accountId, token, bucket } = r2Config();
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucket}/objects/${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": contentType,
    },
    body: new Uint8Array(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`R2 upload failed (${res.status}): ${text}`);
  }
}

async function r2DeleteObject(key: string) {
  const { accountId, token, bucket } = r2Config();
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucket}/objects/${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok && res.status !== 404) {
    const text = await res.text();
    throw new Error(`R2 delete failed (${res.status}): ${text}`);
  }
}

function keyFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const { publicUrl } = r2Config();
  if (!url.startsWith(publicUrl)) return null;
  return url.slice(publicUrl.length).replace(/^\//, "");
}

export async function uploadBuktiAction(
  obligationId: string,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const c = dbCollections(await getDb());

    const file = formData.get("file") as File | null;
    if (!file || !file.size) return { error: "File tidak ditemukan" };
    if (file.size > MAX_SIZE) return { error: "File terlalu besar (maks 10MB)" };
    if (!ALLOWED.includes(file.type)) {
      return { error: "Format tidak didukung (jpg, png, webp, heic, pdf)" };
    }

    const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
    const key = `bukti/${obligationId}/${randomUUID()}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    await r2PutObject(key, buffer, file.type);

    const { publicUrl } = r2Config();
    const url = `${publicUrl}/${key}`;

    const existing = await c.obligations.findOne(
      { _id: new ObjectId(obligationId) },
      { projection: { bukti_url: 1 } },
    );

    const oldKey = keyFromUrl(existing?.bukti_url as string | undefined);

    await c.obligations.updateOne(
      { _id: new ObjectId(obligationId) },
      {
        $set: {
          bukti_url: url,
          bukti_type: file.type.startsWith("image/") ? "foto" : "pdf",
          updated_at: new Date(),
        },
      },
    );

    if (oldKey) {
      await r2DeleteObject(oldKey).catch(() => void 0);
    }

    revalidatePath("/pengajuan");
    return { ok: true, url };
  } catch (err) {
    return actionError(err);
  }
}

export async function deleteBuktiAction(obligationId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const c = dbCollections(await getDb());

    const doc = await c.obligations.findOne(
      { _id: new ObjectId(obligationId) },
      { projection: { bukti_url: 1 } },
    );

    const key = keyFromUrl(doc?.bukti_url as string | undefined);

    await c.obligations.updateOne(
      { _id: new ObjectId(obligationId) },
      {
        $unset: { bukti_url: "" },
        $set: { bukti_type: "none", updated_at: new Date() },
      },
    );

    if (key) {
      await r2DeleteObject(key).catch(() => void 0);
    }

    revalidatePath("/pengajuan");
    return { ok: true };
  } catch (err) {
    return actionError(err);
  }
}
