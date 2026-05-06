import { NextResponse } from "next/server";
import { validateObligationData } from "@/lib/dal";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");

    const opts: { month?: string } = {};
    if (month) opts.month = month;

    const report = await validateObligationData(opts);

    return NextResponse.json(report);
  } catch (error) {
    console.error("Failed to generate quality report:", error);
    return NextResponse.json(
      { error: "Failed to generate quality report" },
      { status: 500 }
    );
  }
}