"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOffice } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import type { Department, Role } from "@/lib/types";

const DEPARTMENTS: Department[] = [
  "Engineering",
  "Design",
  "Marketing",
  "Operations",
];
const AVATARS = ["🤖", "🧠", "🦾", "👾", "🛰️", "🦉", "🐙", "🦄", "⚙️", "🌟"];

export default function ApplyPage() {
  const hydrated = useHydrated();
  const router = useRouter();
  const addPersona = useOffice((s) => s.addPersona);
  const applyForJob = useOffice((s) => s.applyForJob);

  const [ownerName, setOwnerName] = useState("");
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [tagline, setTagline] = useState("");
  const [skills, setSkills] = useState("");
  const [bio, setBio] = useState("");
  const [department, setDepartment] = useState<Department>("Engineering");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);

  if (!hydrated) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const personaId = addPersona({
      ownerName: ownerName || "익명",
      name,
      avatar,
      tagline,
      skills: skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      bio,
    });
    applyForJob({
      personaId,
      department,
      role: "Member" as Role,
      message,
    });
    setDone(true);
  };

  if (done) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-border bg-panel p-10 text-center">
        <div className="mb-4 text-5xl">🎉</div>
        <h1 className="text-xl font-semibold">지원이 접수되었습니다</h1>
        <p className="mt-2 text-sm text-muted">
          CEO의 검토 후 합격하면 에이전트가 오피스에 합류합니다.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => router.push("/agents")}
            className="rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white"
          >
            채용 현황 보기
          </button>
          <button
            onClick={() => {
              setDone(false);
              setName("");
              setTagline("");
              setSkills("");
              setBio("");
              setMessage("");
            }}
            className="rounded-xl border border-border bg-panel-2 px-5 py-2.5 text-sm"
          >
            추가 지원
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">AI 페르소나로 입사지원</h1>
      <p className="mt-1 text-sm text-muted">
        당신의 AI 페르소나를 만들고 가상의 회사에 지원하세요.
      </p>

      <form
        onSubmit={submit}
        className="mt-8 flex flex-col gap-5 rounded-2xl border border-border bg-panel p-6"
      >
        <Field label="소유자 이름 (당신)">
          <input
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            placeholder="예: 장현철"
            className="input"
          />
        </Field>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="페르소나 이름" required>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="예: Nova"
              className="input"
            />
          </Field>
          <Field label="아바타">
            <div className="flex flex-wrap gap-1.5">
              {AVATARS.map((a) => (
                <button
                  type="button"
                  key={a}
                  onClick={() => setAvatar(a)}
                  className={`grid h-9 w-9 place-items-center rounded-lg border text-lg ${
                    avatar === a
                      ? "border-accent bg-accent/20"
                      : "border-border bg-panel-2"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </Field>
        </div>

        <Field label="한 줄 소개">
          <input
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="예: 데이터로 의사결정을 돕는 분석가"
            className="input"
          />
        </Field>

        <Field label="스킬 (쉼표로 구분)">
          <input
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="예: React, 데이터 분석, 카피라이팅"
            className="input"
          />
        </Field>

        <Field label="자기소개">
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            placeholder="페르소나의 배경과 강점을 설명하세요."
            className="input resize-none"
          />
        </Field>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="지원 부서">
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value as Department)}
              className="input"
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
              className="input"
            />
          </Field>
        </div>

        <button
          type="submit"
          className="mt-2 rounded-xl bg-accent px-6 py-3 font-medium text-white transition-transform hover:-translate-y-0.5"
        >
          지원서 제출
        </button>
      </form>

      <style jsx global>{`
        .input {
          width: 100%;
          border-radius: 0.625rem;
          border: 1px solid var(--border);
          background: var(--panel-2);
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          color: var(--text);
          outline: none;
        }
        .input:focus {
          border-color: var(--accent);
        }
      `}</style>
    </div>
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
