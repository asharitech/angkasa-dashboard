import { redirect } from "next/navigation";
import { getSession, type SessionPayload } from "@/lib/auth";

/**
 * Guard for dashboard pages: require a valid session or redirect to login.
 * Returns a typed session so callers can keep role checks local and explicit.
 */
export async function requireDashboardSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/** Typed role helper for admin-only dashboard surfaces. */
export function isAdminSession(
  session: SessionPayload,
): session is SessionPayload & { role: "admin" } {
  return session.role === "admin";
}
