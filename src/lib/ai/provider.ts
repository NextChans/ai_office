// Server-only Claude provider with dual-mode authentication:
//   1) Usage-based API key   (ANTHROPIC_API_KEY)
//   2) Subscription OAuth token (CLAUDE_OAUTH_TOKEN / CLAUDE_CODE_OAUTH_TOKEN)
//
// The deployer configures ONE of these as a server env var. If neither is set,
// callers should fall back to a local heuristic so the app keeps working.

const API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
// Beta flag Claude Code uses when authenticating with a subscription OAuth token.
const OAUTH_BETA = "oauth-2025-04-20";
// Subscription OAuth tokens require the Claude Code system identity as the first
// system block. We prepend it transparently in OAuth mode.
const CLAUDE_CODE_IDENTITY =
  "You are Claude Code, Anthropic's official CLI for Claude.";

const DEFAULT_MODEL = process.env.AI_MODEL || "claude-haiku-4-5-20251001";

export type AIMode = "api_key" | "oauth" | "mock";

export function aiMode(): AIMode {
  if (process.env.ANTHROPIC_API_KEY) return "api_key";
  if (process.env.CLAUDE_OAUTH_TOKEN || process.env.CLAUDE_CODE_OAUTH_TOKEN)
    return "oauth";
  return "mock";
}

export function aiConfigured(): boolean {
  return aiMode() !== "mock";
}

interface CallOpts {
  system?: string;
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

/** Low-level single-turn call. Throws if no credentials are configured. */
export async function callClaude(prompt: string, opts: CallOpts = {}): Promise<string> {
  const mode = aiMode();
  if (mode === "mock") throw new Error("AI_NOT_CONFIGURED");

  const headers: Record<string, string> = {
    "content-type": "application/json",
    "anthropic-version": ANTHROPIC_VERSION,
  };

  let system = opts.system ?? "";

  if (mode === "api_key") {
    headers["x-api-key"] = process.env.ANTHROPIC_API_KEY as string;
  } else {
    const token = (process.env.CLAUDE_OAUTH_TOKEN ||
      process.env.CLAUDE_CODE_OAUTH_TOKEN) as string;
    headers["authorization"] = `Bearer ${token}`;
    headers["anthropic-beta"] = OAUTH_BETA;
    // Required identity prefix for subscription OAuth tokens.
    system = system ? `${CLAUDE_CODE_IDENTITY}\n\n${system}` : CLAUDE_CODE_IDENTITY;
  }

  const res = await fetch(API_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: opts.model ?? DEFAULT_MODEL,
      max_tokens: opts.maxTokens ?? 512,
      temperature: opts.temperature ?? 0.7,
      ...(system ? { system } : {}),
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`AI_REQUEST_FAILED ${res.status} ${detail.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    content?: { type: string; text?: string }[];
  };
  return (data.content ?? [])
    .filter((b) => b.type === "text")
    .map((b) => b.text ?? "")
    .join("")
    .trim();
}

/** Best-effort JSON call: extracts the first JSON object from the response. */
export async function callClaudeJSON<T>(prompt: string, opts: CallOpts = {}): Promise<T> {
  const text = await callClaude(prompt, {
    ...opts,
    system:
      (opts.system ? opts.system + "\n\n" : "") +
      "Respond with ONLY a single valid JSON object. No markdown, no prose.",
  });
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("AI_BAD_JSON");
  return JSON.parse(match[0]) as T;
}
