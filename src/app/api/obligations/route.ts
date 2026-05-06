import { fail, ok } from "@/lib/api/route-helpers";
import { getObligations } from "@/lib/dal";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const month = searchParams.get("month");

    const filter: Record<string, unknown> = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (month) filter.month = month;

    const obligations = await getObligations(filter);

    return ok(obligations);
  } catch (error) {
    console.error("Failed to fetch obligations:", error);
    return fail("Failed to fetch obligations");
  }
}