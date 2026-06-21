import { NextResponse } from "next/server";
import { aiMode } from "@/lib/ai/provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Reports only whether AI is configured and in which mode — no live call,
// no token details (the diagnostic ping was removed after verification).
export async function GET() {
  const mode = aiMode();
  return NextResponse.json({ mode, configured: mode !== "mock" });
}
