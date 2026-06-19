import { NextRequest, NextResponse } from "next/server";
import { summarizeProposal } from "@/lib/ai/tasks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await summarizeProposal({
      description: String(body.description ?? ""),
      kind: String(body.kind ?? "custom"),
      forCount: Number(body.forCount ?? 0),
      againstCount: Number(body.againstCount ?? 0),
    });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "SUMMARY_FAILED" }, { status: 500 });
  }
}
