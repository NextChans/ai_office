import { NextRequest, NextResponse } from "next/server";
import { aiMode, callClaude } from "@/lib/ai/provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const mode = aiMode();
  const ping = new URL(req.url).searchParams.get("ping") === "1";

  // Optional live connectivity check (used to verify a real Claude/OAuth call).
  if (ping && mode !== "mock") {
    // Masked token diagnostics (head/tail are already non-secret; helps spot truncation).
    const raw = (
      process.env.ANTHROPIC_API_KEY ||
      process.env.CLAUDE_OAUTH_TOKEN ||
      process.env.CLAUDE_CODE_OAUTH_TOKEN ||
      ""
    ).replace(/\s+/g, "");
    const tokenInfo = {
      len: raw.length,
      head: raw.slice(0, 14),
      tail: raw.slice(-4),
    };
    try {
      const sample = await callClaude("Reply with exactly: pong", {
        maxTokens: 8,
        temperature: 0,
      });
      return NextResponse.json({ mode, configured: true, ping: "ok", sample: sample.slice(0, 60), tokenInfo });
    } catch (e) {
      return NextResponse.json({
        mode,
        configured: true,
        ping: "error",
        error: String(e instanceof Error ? e.message : e).slice(0, 400),
        tokenInfo,
      });
    }
  }

  return NextResponse.json({ mode, configured: mode !== "mock" });
}
