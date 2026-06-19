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
