import { getSession, hashPassword } from "@/lib/auth";
import { ObjectId } from "mongodb";
import { getCollections } from "@/lib/dal/context";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const { name, role, phone, password } = await request.json();

  const c = await getCollections();
  const update: Record<string, unknown> = { updated_at: new Date() };
  if (name) update.name = name;
  if (role && ["admin", "viewer"].includes(role)) update.role = role;
  if (phone !== undefined) update.phone = phone || null;
  if (password) update.password_hash = await hashPassword(password);

  await c.users.updateOne(
    { _id: new ObjectId(id) },
    { $set: update }
  );

  return Response.json({ success: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  // Prevent deleting yourself
  if (session.userId === id) {
    return Response.json({ error: "Tidak bisa hapus akun sendiri" }, { status: 400 });
  }

  const c = await getCollections();
  await c.users.deleteOne({ _id: new ObjectId(id) });
  return Response.json({ success: true });
}
