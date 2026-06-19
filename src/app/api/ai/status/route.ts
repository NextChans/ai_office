import { NextResponse } from "next/server";
import { aiMode } from "@/lib/ai/provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const mode = aiMode();
  return NextResponse.json({ mode, configured: mode !== "mock" });
}
