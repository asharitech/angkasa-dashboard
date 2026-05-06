import { getSession, hashPassword } from "@/lib/auth";
import { getCollections } from "@/lib/dal/context";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  const c = await getCollections();
  const users = await c.users
    .find({}, { projection: { password_hash: 0 } })
    .sort({ created_at: -1 })
    .toArray();

  return Response.json({ users });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { username, password, name, role, phone } = await request.json();

  if (!username || !password || !name || !role) {
    return Response.json({ error: "Field wajib belum lengkap" }, { status: 400 });
  }

  if (!["admin", "viewer"].includes(role)) {
    return Response.json({ error: "Role tidak valid" }, { status: 400 });
  }

  const c = await getCollections();
  const existing = await c.users.findOne({ username });
  if (existing) {
    return Response.json({ error: "Username sudah dipakai" }, { status: 409 });
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

  return Response.json({ success: true, id: result.insertedId.toString() }, { status: 201 });
}
