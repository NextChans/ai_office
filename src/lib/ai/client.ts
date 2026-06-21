"use client";

import { useEffect, useState } from "react";
import type { PersonaEval, MeetingAgent, MeetingResult } from "./tasks";

export type AIMode = "api_key" | "oauth" | "mock";

export function useAIStatus() {
  const [mode, setMode] = useState<AIMode | null>(null);
  useEffect(() => {
    let alive = true;
    fetch("/api/ai/status")
      .then((r) => r.json())
      .then((d) => alive && setMode(d.mode))
      .catch(() => alive && setMode("mock"));
    return () => {
      alive = false;
    };
  }, []);
  return { mode, configured: mode !== null && mode !== "mock", loading: mode === null };
}

export async function evaluatePersona(input: {
  name: string;
  tagline: string;
  skills: string[];
  department: string;
  message: string;
}): Promise<PersonaEval> {
  const res = await fetch("/api/ai/evaluate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("eval failed");
  return res.json();
}

export async function summarizeProposal(input: {
  description: string;
  kind: string;
  forCount: number;
  againstCount: number;
}): Promise<{ text: string; fromAI: boolean }> {
  const res = await fetch("/api/ai/proposal-summary", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("summary failed");
  return res.json();
}

export async function runMeeting(input: {
  company: string;
  topic: string;
  agents: MeetingAgent[];
}): Promise<MeetingResult> {
  const res = await fetch("/api/agents/converse", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("meeting failed");
  return res.json();
}
