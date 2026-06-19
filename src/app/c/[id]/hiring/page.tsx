"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useOffice } from "@/lib/store";
import { StatusPill } from "@/components/StatusPill";
import { Badge } from "@/components/ui";
import { toast } from "@/components/ui/toast";
import { evaluatePersona as aiEvaluate } from "@/lib/ai/client";
import type { PersonaEval } from "@/lib/ai/tasks";
import type { Application, Department, Persona, Role } from "@/lib/types";

type Tab = "apply" | "review";

const DEPARTMENTS: Department[] = ["Engineering", "Design", "Marketing", "Operations"];
const AVATARS = ["🤖", "🧠", "🦾", "👾", "🛰️", "🦉", "🐙", "🦄", "⚙️", "🌟"];

export default function HiringPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<Tab>("review");

  const personas = useOffice((s) => s.personas);
  const allApplications = useOffice((s) => s.applications);
  const decideApplication = useOffice((s) => s.decideApplication);

  const applications = useMemo(
    () => allApplications.filter((a) => a.companyId === id),
    [allApplications, id]
  );
  const personaById = (pid: string) => personas.find((p) => p.id === pid);
  const pending = applications.filter((a) => a.status === "pending").length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-1 rounded-xl border border-border bg-panel p-1 text-sm">
        {(
          [
            ["review", `지원서 검토 (${pending})`],
            ["apply", "지원하기"],
          ] as [Tab, string][]
        ).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-lg px-3 py-2 transition-colors ${
              tab === t ? "bg-accent/20 text-accent" : "text-muted hover:text-text"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "review" && (
        <div className="grid gap-3">
          {applications.length === 0 && (
            <Empty>아직 지원서가 없습니다. 지원하기 탭에서 페르소나를 등록해 보세요.</Empty>
          )}
          {applications.map((app) => {
            const p = personaById(app.personaId);
            if (!p) return null;
            return (
              <ApplicationRow
                key={app.id}
                app={app}
                persona={p}
                onHire={() => {
                  decideApplication(app.id, "hired");
                  toast.success(`${p.name}님을 채용했습니다! 오피스에 합류합니다 🎉`);
                }}
                onReject={() => {
                  decideApplication(app.id, "rejected");
                  toast.info(`${p.name}님의 지원을 보류했습니다.`);
                }}
              />
            );
          })}
        </div>
      )}

      {tab === "apply" && <ApplyForm companyId={id} onApplied={() => setTab("review")} />}
    </div>
  );
}

function ApplicationRow({
  app,
  persona,
  onHire,
  onReject,
}: {
  app: Application;
  persona: Persona;
  onHire: () => void;
  onReject: () => void;
}) {
  const [evalResult, setEvalResult] = useState<PersonaEval | null>(null);
  const [loading, setLoading] = useState(false);

  const runEval = async () => {
    setLoading(true);
    try {
      const r = await aiEvaluate({
        name: persona.name,
        tagline: persona.tagline,
        skills: persona.skills,
        department: app.department,
        message: app.message,
      });
      setEvalResult(r);
    } catch {
      toast.error("AI 평가에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-panel p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-panel-2 text-xl">
            {persona.avatar}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{persona.name}</span>
              <span className="text-xs text-muted">@{persona.ownerName}</span>
              <StatusPill status={appStatusToPill(app.status)} />
            </div>
            <p className="text-sm text-muted">{persona.tagline}</p>
            <p className="mt-1 text-xs text-muted">
              {app.department} 지원 · “{app.message || "동기 미작성"}”
            </p>
            {persona.skills.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {persona.skills.map((s) => (
                  <span
                    key={s}
                    className="rounded-full border border-border bg-panel-2 px-2 py-0.5 text-[11px] text-muted"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        {app.status === "pending" && (
          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              onClick={runEval}
              disabled={loading}
              className="rounded-lg border border-accent/40 bg-accent/10 px-3 py-1.5 text-sm text-accent focus-ring disabled:opacity-60"
            >
              {loading ? "평가 중…" : "🤖 AI 평가"}
            </button>
            <button
              onClick={onHire}
              className="rounded-lg bg-accent-2/20 px-3 py-1.5 text-sm text-accent-2 focus-ring"
            >
              채용
            </button>
            <button
              onClick={onReject}
              className="rounded-lg bg-danger/20 px-3 py-1.5 text-sm text-danger focus-ring"
            >
              불합격
            </button>
          </div>
        )}
      </div>

      {evalResult && (
        <div className="rounded-xl border border-accent/30 bg-accent/5 p-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-accent">AI 평가</span>
            <Badge tone="accent">{evalResult.score}점</Badge>
            <Badge tone={evalResult.score >= 70 ? "success" : "warn"}>
              {evalResult.verdict}
            </Badge>
            {!evalResult.fromAI && <Badge tone="neutral">휴리스틱</Badge>}
          </div>
          <p className="mt-1.5 text-xs text-muted">{evalResult.summary}</p>
        </div>
      )}
    </div>
  );
}

function ApplyForm({
  companyId,
  onApplied,
}: {
  companyId: string;
  onApplied: () => void;
}) {
  const addPersona = useOffice((s) => s.addPersona);
  const applyForJob = useOffice((s) => s.applyForJob);

  const [ownerName, setOwnerName] = useState("");
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [tagline, setTagline] = useState("");
  const [skills, setSkills] = useState("");
  const [department, setDepartment] = useState<Department>("Engineering");
  const [message, setMessage] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const personaId = addPersona({
      ownerName: ownerName || "익명",
      name,
      avatar,
      tagline,
      skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
      bio: tagline,
    });
    applyForJob({
      companyId,
      personaId,
      department,
      role: "Member" as Role,
      message,
    });
    toast.success(`${name} 지원서를 제출했습니다. 검토를 기다려 주세요!`);
    setName("");
    setTagline("");
    setSkills("");
    setMessage("");
    onApplied();
  };

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-5 rounded-2xl border border-border bg-panel p-6"
    >
      <p className="text-sm text-muted">
        이 회사에 지원할 AI 페르소나를 만들어 제출하세요. CEO 검토 후 합격하면
        에이전트가 오피스에 합류합니다.
      </p>

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="페르소나 이름" required>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="예: Nova"
            className="hinput"
          />
        </Field>
        <Field label="소유자 이름 (당신)">
          <input
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            placeholder="예: 장현철"
            className="hinput"
          />
        </Field>
      </div>

      <Field label="아바타">
        <div className="flex flex-wrap gap-1.5">
          {AVATARS.map((a) => (
            <button
              type="button"
              key={a}
              onClick={() => setAvatar(a)}
              className={`grid h-9 w-9 place-items-center rounded-lg border text-lg ${
                avatar === a ? "border-accent bg-accent/20" : "border-border bg-panel-2"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </Field>

      <Field label="한 줄 소개">
        <input
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder="예: 데이터로 의사결정을 돕는 분석가"
          className="hinput"
        />
      </Field>

      <Field label="스킬 (쉼표로 구분)">
        <input
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
          placeholder="예: React, 데이터 분석, 카피라이팅"
          className="hinput"
        />
      </Field>

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="지원 부서">
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value as Department)}
            className="hinput"
          >
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </Field>
        <Field label="지원 동기">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="왜 이 회사에서 일하고 싶나요?"
            className="hinput"
          />
        </Field>
      </div>

      <button
        type="submit"
        className="rounded-xl bg-accent px-6 py-3 font-medium text-white transition-transform hover:-translate-y-0.5"
      >
        지원서 제출
      </button>

      <style jsx global>{`
        .hinput {
          width: 100%;
          border-radius: 0;
          border: 2px solid var(--ink);
          background: var(--panel-2);
          padding: 0.6rem 0.75rem;
          font-size: 0.875rem;
          color: var(--text);
          outline: none;
          box-shadow: inset 2px 2px 0 rgba(0, 0, 0, 0.35);
        }
        .hinput:focus {
          outline: 2px solid var(--accent);
          border-color: var(--accent);
        }
      `}</style>
    </form>
  );
}

function appStatusToPill(status: string) {
  return (
    { pending: "proposed", hired: "approved", rejected: "cancelled", interview: "held" }[
      status
    ] ?? status
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-muted">
        {label}
        {required && <span className="text-danger"> *</span>}
      </span>
      {children}
    </label>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-panel/50 py-12 text-center text-sm text-muted">
      {children}
    </div>
  );
}
