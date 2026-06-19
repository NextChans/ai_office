import { NextRequest, NextResponse } from "next/server";
import { evaluatePersona } from "@/lib/ai/tasks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await evaluatePersona({
      name: String(body.name ?? ""),
      tagline: String(body.tagline ?? ""),
      skills: Array.isArray(body.skills) ? body.skills.map(String) : [],
      department: String(body.department ?? ""),
      message: String(body.message ?? ""),
    });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "EVAL_FAILED" }, { status: 500 });
  }
}
