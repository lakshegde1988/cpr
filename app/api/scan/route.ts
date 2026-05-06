import { NextResponse } from "next/server";
import { scanPost, scanUniverse } from "@/lib/cpr/scan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const universe = searchParams.get("universe") ?? "fno";
  try {
    const data = await scanUniverse(universe);
    return NextResponse.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Scan failed";
    const status = msg.includes("Invalid universe") ? 400 : 500;
    return NextResponse.json({ detail: msg }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { stocks?: Record<string, unknown>[] };
    if (!body.stocks || !Array.isArray(body.stocks)) {
      return NextResponse.json(
        { detail: "Request body must include stocks array" },
        { status: 400 }
      );
    }
    const data = await scanPost({ stocks: body.stocks });
    return NextResponse.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Scan failed";
    return NextResponse.json({ detail: msg }, { status: 400 });
  }
}
