import { hashPassword } from "@/lib/auth";
import { AuthError, requireAdmin } from "@/lib/auth-helpers";
import { fail, ok, parseObjectId } from "@/lib/api/route-helpers";
import { getCollections } from "@/lib/dal/context";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const objectId = parseObjectId(id);
    if (!objectId) return fail("ID user tidak valid", 400);

    const { name, role, phone, password } = await request.json();

    const c = await getCollections();
    const update: Record<string, unknown> = { updated_at: new Date() };
    if (name) update.name = name;
    if (role && ["admin", "viewer"].includes(role)) update.role = role;
    if (phone !== undefined) update.phone = phone || null;
    if (password) update.password_hash = await hashPassword(password);

    await c.users.updateOne(
      { _id: objectId },
      { $set: update }
    );

    return ok({ success: true });
  } catch (err) {
    if (err instanceof AuthError) return fail(err.message, err.status);
    return fail(err instanceof Error ? err.message : "Gagal update user");
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    const objectId = parseObjectId(id);
    if (!objectId) return fail("ID user tidak valid", 400);

    // Prevent deleting yourself
    if (session.userId === id) {
      return fail("Tidak bisa hapus akun sendiri", 400);
    }

    const c = await getCollections();
    await c.users.deleteOne({ _id: objectId });
    return ok({ success: true });
  } catch (err) {
    if (err instanceof AuthError) return fail(err.message, err.status);
    return fail(err instanceof Error ? err.message : "Gagal hapus user");
  }
}
