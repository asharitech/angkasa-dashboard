import { getSession, type SessionPayload } from "./auth";

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 403) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

/**
 * Guard for server actions and route handlers that require an admin session.
 * Throws AuthError (401 if no session, 403 if non-admin) so callers can
 * rethrow or translate to a user-facing message.
 */
export async function requireAdmin(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new AuthError("Sesi tidak valid", 401);
  if (session.role !== "admin") throw new AuthError("Hanya admin yang dapat melakukan aksi ini", 403);
  return session;
}

/**
 * Translate unknown errors thrown inside a server action into a user-facing
 * { error } shape. Keeps form code free of try/catch boilerplate.
 */
export function actionError(err: unknown): { error: string } {
  if (err instanceof Error) return { error: err.message };
  return { error: "Terjadi kesalahan" };
}
