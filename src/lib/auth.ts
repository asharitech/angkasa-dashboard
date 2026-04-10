import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getDb } from "./mongodb";
import bcrypt from "bcryptjs";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "angkasa-dashboard-secret-change-me"
);

export interface User {
  _id: string;
  username: string;
  name: string;
  role: "admin" | "viewer";
  phone?: string;
  created_at: string;
}

export interface SessionPayload {
  userId: string;
  username: string;
  role: string;
}

export async function createToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(SECRET);
}

export async function verifyToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function login(
  username: string,
  password: string
): Promise<{ success: boolean; error?: string; user?: User }> {
  const db = await getDb();
  const user = await db.collection("users").findOne({ username });
  if (!user) return { success: false, error: "Username tidak ditemukan" };

  const valid = await bcrypt.compare(password, user.password_hash as string);
  if (!valid) return { success: false, error: "Password salah" };

  const token = await createToken({
    userId: user._id.toString(),
    username: user.username as string,
    role: user.role as string,
  });

  const cookieStore = await cookies();
  cookieStore.set("auth", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });

  return {
    success: true,
    user: {
      _id: user._id.toString(),
      username: user.username as string,
      name: user.name as string,
      role: user.role as string,
      phone: user.phone as string | undefined,
      created_at: (user.created_at as Date).toISOString(),
    } as User,
  };
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("auth");
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}
