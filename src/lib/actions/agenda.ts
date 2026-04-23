"use server";

import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { dbCollections } from "@/lib/db/collections";
import { requireAdmin, actionError } from "@/lib/auth-helpers";

type ActionResult = { ok: true; id?: string } | { error: string };

export type AgendaPriority = "tinggi" | "sedang" | "rendah";
export type AgendaStatus = "belum" | "selesai";
export type AgendaKategori =
  | "yayasan"
  | "keuangan"
  | "pribadi"
  | "operasional"
  | "rapat"
  | "perjalanan"
  | "lainnya";

export interface AgendaInput {
  title: string;
  description?: string | null;
  due_date: string;           // ISO date string YYYY-MM-DD
  priority?: AgendaPriority;
  kategori?: AgendaKategori;
  tags?: string[];
  reminder_at?: string | null;
}

export async function createAgendaAction(input: AgendaInput): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const c = dbCollections(await getDb());
    const now = new Date();

    if (!input.title?.trim()) return { error: "Judul agenda wajib diisi" };
    if (!input.due_date) return { error: "Tanggal wajib diisi" };

    const doc = {
      title: input.title.trim(),
      description: input.description?.trim() ?? null,
      due_date: input.due_date,
      priority: input.priority ?? "sedang",
      kategori: input.kategori ?? "lainnya",
      status: "belum" as AgendaStatus,
      tags: input.tags ?? [],
      reminder_at: input.reminder_at ?? null,
      owner: "angkasa",
      created_by: session.userId,
      updated_by: session.userId,
      completed_at: null,
      created_at: now,
      updated_at: now,
    };

    const result = await c.agenda.insertOne(doc as Parameters<typeof c.agenda.insertOne>[0]);
    revalidatePath("/agenda");
    return { ok: true, id: result.insertedId.toString() };
  } catch (err) {
    return actionError(err);
  }
}

export async function updateAgendaAction(
  id: string,
  patch: Partial<AgendaInput>,
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const c = dbCollections(await getDb());
    const existing = await c.agenda.findOne({ _id: new ObjectId(id) });
    if (!existing) return { error: "Agenda tidak ditemukan" };

    const update: Record<string, unknown> = {
      ...patch,
      updated_by: session.userId,
      updated_at: new Date(),
    };
    if (patch.title) update.title = patch.title.trim();

    await c.agenda.updateOne(
      { _id: new ObjectId(id) },
      { $set: update },
    );
    revalidatePath("/agenda");
    return { ok: true };
  } catch (err) {
    return actionError(err);
  }
}

export async function toggleAgendaStatusAction(
  id: string,
  currentStatus: AgendaStatus,
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const c = dbCollections(await getDb());
    const newStatus: AgendaStatus = currentStatus === "belum" ? "selesai" : "belum";
    const now = new Date();

    await c.agenda.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: newStatus,
          completed_at: newStatus === "selesai" ? now : null,
          updated_by: session.userId,
          updated_at: now,
        },
      },
    );
    revalidatePath("/agenda");
    return { ok: true };
  } catch (err) {
    return actionError(err);
  }
}

export async function deleteAgendaAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const c = dbCollections(await getDb());
    const result = await c.agenda.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) return { error: "Agenda tidak ditemukan" };
    revalidatePath("/agenda");
    return { ok: true };
  } catch (err) {
    return actionError(err);
  }
}
