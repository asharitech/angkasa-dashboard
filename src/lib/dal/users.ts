import { getCollections } from "./context";
import type { UserListRow } from "./types";

export async function getUsersForAdmin(): Promise<UserListRow[]> {
  const c = await getCollections();
  const rows = await c.users
    .find({}, { projection: { password_hash: 0 } })
    .sort({ created_at: -1 })
    .toArray();

  return rows.map((u) => ({
    _id: String(u._id),
    username: String(u.username ?? ""),
    name: String(u.name ?? ""),
    role: u.role === "admin" ? "admin" : "viewer",
    phone: u.phone ? String(u.phone) : undefined,
    created_at: u.created_at instanceof Date ? u.created_at.toISOString() : String(u.created_at ?? ""),
  }));
}
