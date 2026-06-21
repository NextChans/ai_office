import { NextRequest, NextResponse } from "next/server";
import { runMeeting, type MeetingAgent } from "@/lib/ai/tasks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const agents: MeetingAgent[] = Array.isArray(body.agents)
      ? body.agents.slice(0, 8).map((a: Record<string, unknown>) => ({
          name: String(a.name ?? ""),
          role: String(a.role ?? "Member"),
          department: String(a.department ?? ""),
          tagline: String(a.tagline ?? ""),
          skills: Array.isArray(a.skills) ? a.skills.map(String) : [],
        }))
      : [];
    const result = await runMeeting({
      company: String(body.company ?? "회사"),
      topic: String(body.topic ?? "이번 주 우선순위"),
      agents,
    });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "MEETING_FAILED" }, { status: 500 });
  }
}
