import { getSession, type SessionPayload } from "@/lib/auth";

/** Thrown by `requireAdmin` when the caller is not allowed (API routes). */
export class AuthError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Require an authenticated session with role `admin`.
 * Matches prior `/api/users` behavior: 403 + "Unauthorized" when missing or non-admin.
 */
export async function requireAdmin(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    throw new AuthError("Unauthorized", 403);
  }
  return session;
}

/** Normalizes server-action catch values into `{ error: string }`. */
export function actionError(e: unknown): { error: string } {
  if (e instanceof AuthError) return { error: e.message };
  if (typeof e === "string") return { error: e };
  if (e instanceof Error) return { error: e.message };
  return { error: "Terjadi kesalahan" };
}
