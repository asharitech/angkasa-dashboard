import { login } from "@/lib/auth";

export async function POST(request: Request) {
  const { username, password } = await request.json();

  if (!username || !password) {
    return Response.json(
      { success: false, error: "Username dan password wajib diisi" },
      { status: 400 }
    );
  }

  const result = await login(username, password);
  return Response.json(result, { status: result.success ? 200 : 401 });
}
