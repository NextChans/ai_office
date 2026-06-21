// Higher-level AI tasks with graceful heuristic fallbacks when Claude is not
// configured. Server-only (imported from route handlers).

import { aiConfigured, callClaudeJSON, callClaude } from "./provider";

export interface PersonaEval {
  score: number; // 0-100
  verdict: string; // short recommendation, e.g. "강력 추천"
  summary: string; // 1-2 sentence rationale
  fromAI: boolean;
}

export async function evaluatePersona(input: {
  name: string;
  tagline: string;
  skills: string[];
  department: string;
  message: string;
}): Promise<PersonaEval> {
  if (aiConfigured()) {
    try {
      const r = await callClaudeJSON<{
        score: number;
        verdict: string;
        summary: string;
      }>(
        `다음 AI 페르소나의 ${input.department} 부서 적합도를 평가하세요.\n` +
          `이름: ${input.name}\n소개: ${input.tagline}\n` +
          `스킬: ${input.skills.join(", ") || "없음"}\n지원동기: ${input.message || "없음"}\n\n` +
          `score(0-100 정수), verdict(한국어 5자 이내 한줄 판정), summary(한국어 1-2문장 근거) 키를 가진 JSON으로 답하세요.`,
        { maxTokens: 300, temperature: 0.4 }
      );
      return {
        score: clamp(Math.round(r.score), 0, 100),
        verdict: r.verdict?.slice(0, 20) || "검토 필요",
        summary: r.summary || "",
        fromAI: true,
      };
    } catch {
      // fall through to heuristic
    }
  }
  return heuristicEval(input);
}

function heuristicEval(input: {
  name: string;
  tagline: string;
  skills: string[];
  message: string;
}): PersonaEval {
  let score = 50;
  score += Math.min(input.skills.length, 5) * 7;
  if (input.tagline.length > 12) score += 8;
  if (input.message.length > 12) score += 8;
  score = clamp(score, 30, 95);
  const verdict = score >= 80 ? "강력 추천" : score >= 60 ? "추천" : "보통";
  return {
    score,
    verdict,
    summary: `스킬 ${input.skills.length}개와 자기소개를 바탕으로 한 휴리스틱 평가입니다. (AI 미연동)`,
    fromAI: false,
  };
}

export async function summarizeProposal(input: {
  description: string;
  kind: string;
  forCount: number;
  againstCount: number;
}): Promise<{ text: string; fromAI: boolean }> {
  if (aiConfigured()) {
    try {
      const text = await callClaude(
        `이사회 안건을 2문장 이내 한국어로 요약하고 의결 권고를 제시하세요.\n` +
          `안건: ${input.description}\n유형: ${input.kind}\n` +
          `현재 찬성 ${input.forCount} / 반대 ${input.againstCount}.`,
        { maxTokens: 200, temperature: 0.5 }
      );
      return { text: text.slice(0, 400), fromAI: true };
    } catch {
      // fall through
    }
  }
  const lean =
    input.forCount > input.againstCount
      ? "현재 찬성 우세로 가결 가능성이 높습니다."
      : input.forCount < input.againstCount
        ? "현재 반대 우세로 부결 가능성이 있습니다."
        : "찬반이 팽팽합니다. 추가 논의가 필요합니다.";
  return { text: `${input.description} — ${lean} (AI 미연동)`, fromAI: false };
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

// ─── Multi-agent standup meeting ────────────────────────────────────────────
export interface MeetingAgent {
  name: string;
  role: string;
  department: string;
  tagline: string;
  skills: string[];
}
export interface MeetingTurn {
  name: string;
  message: string;
}
export interface MeetingAction {
  agentName: string;
  title: string;
  detail: string;
}
export interface MeetingResult {
  turns: MeetingTurn[];
  summary: string;
  actions: MeetingAction[];
  fromAI: boolean;
}

const CANNED = [
  "이번 주 우선순위부터 정리하죠.",
  "그건 제가 맡을게요.",
  "리뷰는 오늘 안에 끝낼 수 있어요.",
  "사용자 피드백이 꽤 좋아요!",
  "배포 일정은 무리 없어 보여요.",
  "디자인 시안 공유드릴게요.",
  "그 부분은 같이 페어로 보죠.",
  "좋은 아이디어인데요?",
];

export async function runMeeting(input: {
  company: string;
  topic: string;
  agents: MeetingAgent[];
}): Promise<MeetingResult> {
  const { company, topic, agents } = input;
  if (agents.length === 0) {
    return { turns: [], summary: "참여할 직원이 없습니다.", actions: [], fromAI: false };
  }

  if (aiConfigured()) {
    try {
      const roster = agents
        .map((a) => `- ${a.name} (${a.role}, ${a.department}): ${a.tagline || "—"} [스킬: ${a.skills.join(", ") || "—"}]`)
        .join("\n");
      const r = await callClaudeJSON<{
        turns: { name: string; message: string }[];
        summary: string;
        actions: { agentName: string; title: string; detail: string }[];
      }>(
        `가상 회사 "${company}"의 직원들이 짧은 스탠드업 회의를 합니다.\n` +
          `참여자:\n${roster}\n\n` +
          `주제: ${topic}\n\n` +
          `각 직원이 자신의 역할·성격에 맞게 한국어로 1~2문장씩 발언하고 서로 자연스럽게 반응하세요. ` +
          `총 4~6턴. 그리고 회의에서 도출된 실행 액션 1~3개를 제안하세요.\n` +
          `반드시 참여자 목록의 정확한 이름(name)만 사용하세요.\n` +
          `JSON 형식: {"turns":[{"name","message"}],"summary":"회의 요약 1~2문장","actions":[{"agentName","title","detail"}]}`,
        { maxTokens: 1200, temperature: 0.8 }
      );
      const names = new Set(agents.map((a) => a.name));
      const turns = (r.turns ?? [])
        .filter((t) => t && t.message)
        .map((t) => ({ name: names.has(t.name) ? t.name : agents[0].name, message: String(t.message).slice(0, 160) }))
        .slice(0, 8);
      const actions = (r.actions ?? [])
        .filter((a) => a && a.title)
        .map((a) => ({
          agentName: names.has(a.agentName) ? a.agentName : agents[0].name,
          title: String(a.title).slice(0, 80),
          detail: String(a.detail ?? "").slice(0, 200),
        }))
        .slice(0, 3);
      if (turns.length > 0) {
        return { turns, summary: (r.summary ?? "").slice(0, 300), actions, fromAI: true };
      }
    } catch {
      // fall through to heuristic
    }
  }

  // Heuristic fallback
  const turns: MeetingTurn[] = agents
    .slice(0, 6)
    .map((a, i) => ({ name: a.name, message: CANNED[i % CANNED.length] }));
  const lead = agents[0];
  return {
    turns,
    summary: `${company}의 ${topic} 회의를 진행했습니다. (AI 미연동 — 예시 대화)`,
    actions: [
      { agentName: lead.name, title: "회의 후속 작업 정리", detail: `${topic} 관련 액션 아이템을 정리합니다.` },
    ],
    fromAI: false,
  };
}
