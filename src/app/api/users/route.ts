import { hashPassword } from "@/lib/auth";
import { AuthError, requireAdmin } from "@/lib/auth-helpers";
import { fail, ok } from "@/lib/api/route-helpers";
import { getUsersForAdmin } from "@/lib/dal";
import { getCollections } from "@/lib/dal/context";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    const users = await getUsersForAdmin();
    return ok({ users });
  } catch (err) {
    if (err instanceof AuthError) return fail(err.message, err.status);
    return fail(err instanceof Error ? err.message : "Gagal memuat users");
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const { username, password, name, role, phone } = await request.json();

    if (!username || !password || !name || !role) {
      return fail("Field wajib belum lengkap", 400);
    }

    if (!["admin", "viewer"].includes(role)) {
      return fail("Role tidak valid", 400);
    }

    const c = await getCollections();
    const existing = await c.users.findOne({ username });
    if (existing) {
      return fail("Username sudah dipakai", 409);
    }

    const password_hash = await hashPassword(password);
    const result = await c.users.insertOne({
      username,
      password_hash,
      name,
      role,
      phone: phone || null,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return ok({ success: true, id: result.insertedId.toString() }, 201);
  } catch (err) {
    if (err instanceof AuthError) return fail(err.message, err.status);
    return fail(err instanceof Error ? err.message : "Gagal menambah user");
  }
}
