import { NextRequest, NextResponse } from "next/server";
import { aiMode, callClaude } from "@/lib/ai/provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const mode = aiMode();
  const ping = new URL(req.url).searchParams.get("ping") === "1";

  // Optional live connectivity check (used to verify a real Claude/OAuth call).
  if (ping && mode !== "mock") {
    try {
      const sample = await callClaude("Reply with exactly: pong", {
        maxTokens: 8,
        temperature: 0,
      });
      return NextResponse.json({ mode, configured: true, ping: "ok", sample: sample.slice(0, 60) });
    } catch (e) {
      return NextResponse.json({
        mode,
        configured: true,
        ping: "error",
        error: String(e instanceof Error ? e.message : e).slice(0, 400),
      });
    }
  }

  return NextResponse.json({ mode, configured: mode !== "mock" });
}
