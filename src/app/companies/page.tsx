"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useOffice } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { useAuth } from "@/lib/auth";
import { toast } from "@/components/ui/toast";

const AVATARS = ["🧭", "🚀", "🦁", "🦊", "🐯", "🦅", "🧠", "⚡", "🌐", "💎"];

const GUIDE_KEY = "ai-office-guide-dismissed";

export default function CompaniesPage() {
  const hydrated = useHydrated();
  const router = useRouter();
  const companies = useOffice((s) => s.companies);
  const agents = useOffice((s) => s.agents);
  const currentCompanyId = useOffice((s) => s.currentCompanyId);
  const setCurrentCompany = useOffice((s) => s.setCurrentCompany);

  const agentCount = useMemo(() => {
    const map: Record<string, number> = {};
    for (const a of agents) map[a.companyId] = (map[a.companyId] ?? 0) + 1;
    return map;
  }, [agents]);

  if (!hydrated) return null;

  const enter = (id: string) => {
    setCurrentCompany(id);
    router.push(`/c/${id}/office`);
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">회사 둘러보기</h1>
        <p className="text-sm text-muted">
          데모 회사를 구경하거나, 직접 회사를 설립해 CEO가 되어보세요.
        </p>
      </div>

      <OnboardingGuide />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {companies.map((c) => {
          const ceo = agents.find((a) => a.id === c.ceoAgentId);
          const active = c.id === currentCompanyId;
          return (
            <div
              key={c.id}
              className={`flex flex-col gap-3 rounded-2xl border bg-panel p-5 transition-colors ${
                active ? "border-accent" : "border-border hover:border-accent/40"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold">{c.name}</h2>
                    {c.isDemo && (
                      <span className="rounded-full border border-accent/40 bg-accent/15 px-2 py-0.5 text-[10px] text-accent">
                        데모
                      </span>
                    )}
                    {active && (
                      <span className="rounded-full bg-accent-2/20 px-2 py-0.5 text-[10px] text-accent-2">
                        현재
                      </span>
                    )}
                  </div>
                  {c.industry && (
                    <p className="text-xs text-muted">{c.industry}</p>
                  )}
                </div>
              </div>

              <p className="line-clamp-2 text-sm text-muted">{c.mission}</p>

              <div className="mt-auto flex items-center justify-between border-t border-border pt-3 text-xs text-muted">
                <span>
                  {ceo ? `${ceo.avatar} ${ceo.name}` : "CEO 공석"} · 설립자{" "}
                  {c.ownerName}
                </span>
                <span>{agentCount[c.id] ?? 0}명</span>
              </div>

              <button
                onClick={() => enter(c.id)}
                className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white transition-transform hover:-translate-y-0.5"
              >
                오피스 입장
              </button>
            </div>
          );
        })}
      </div>

      <CreateCompany
        onCreated={(newId) => router.push(`/c/${newId}/office`)}
        avatars={AVATARS}
      />
    </div>
  );
}

function CreateCompany({
  onCreated,
  avatars,
}: {
  onCreated: (id: string) => void;
  avatars: string[];
}) {
  const createCompany = useOffice((s) => s.createCompany);
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [mission, setMission] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ceoName, setCeoName] = useState("");
  const [ceoAvatar, setCeoAvatar] = useState(avatars[0]);

  // Prefill the founder with the signed-in user's name when available.
  useEffect(() => {
    if (user && !ownerName) setOwnerName(user.name);
  }, [user, ownerName]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = createCompany({
      name: name.trim(),
      mission: mission.trim() || "우리는 더 나은 미래를 만든다.",
      industry: industry.trim() || "일반",
      ownerName: ownerName.trim() || "익명",
      ceoName: ceoName.trim() || `${name.trim()} CEO`,
      ceoAvatar,
    });
    toast.success(`${name.trim()} 설립 완료! 당신이 CEO입니다 👑`);
    onCreated(newId);
  };

  return (
    <section className="rounded-2xl border border-border bg-gradient-to-br from-panel to-bg-soft p-6">
      <div className="mb-1 flex items-center gap-2">
        <span className="text-xl">🏗️</span>
        <h2 className="text-lg font-semibold">새 회사 설립</h2>
      </div>
      <p className="mb-5 text-sm text-muted">
        회사를 만들면 당신의 CEO 에이전트가 자동으로 임명되고, 즉시 채용을 시작할
        수 있습니다.
      </p>

      <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
        <Field label="회사명" required>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="예: Orbit AI"
            className="cinput"
          />
        </Field>
        <Field label="산업 분야">
          <input
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            placeholder="예: 핀테크, 커머스, 게임"
            className="cinput"
          />
        </Field>
        <div className="md:col-span-2">
          <Field label="미션">
            <input
              value={mission}
              onChange={(e) => setMission(e.target.value)}
              placeholder="회사가 추구하는 목표를 한 문장으로"
              className="cinput"
            />
          </Field>
        </div>

        <Field label="설립자 이름 (당신)">
          <input
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            placeholder="예: 장현철"
            className="cinput"
          />
        </Field>
        <Field label="CEO 에이전트 이름">
          <input
            value={ceoName}
            onChange={(e) => setCeoName(e.target.value)}
            placeholder="예: Atlas"
            className="cinput"
          />
        </Field>

        <div className="md:col-span-2">
          <Field label="CEO 아바타">
            <div className="flex flex-wrap gap-1.5">
              {avatars.map((a) => (
                <button
                  type="button"
                  key={a}
                  onClick={() => setCeoAvatar(a)}
                  className={`grid h-9 w-9 place-items-center rounded-lg border text-lg ${
                    ceoAvatar === a
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

        <div className="md:col-span-2">
          <button
            type="submit"
            className="w-full rounded-xl bg-accent px-6 py-3 font-medium text-white transition-transform hover:-translate-y-0.5"
          >
            회사 설립하고 CEO 되기 👑
          </button>
        </div>
      </form>

      <style jsx global>{`
        .cinput {
          width: 100%;
          border-radius: 0.625rem;
          border: 1px solid var(--border);
          background: var(--panel-2);
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          color: var(--text);
          outline: none;
        }
        .cinput:focus {
          border-color: var(--accent);
        }
      `}</style>
    </section>
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

function OnboardingGuide() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(localStorage.getItem(GUIDE_KEY) !== "1");
  }, []);

  if (!show) return null;

  const dismiss = () => {
    localStorage.setItem(GUIDE_KEY, "1");
    setShow(false);
  };

  const steps = [
    ["🏙️", "오피스 입장", "데모 회사에 들어가 2.5D 사무실과 직원들을 구경하세요."],
    ["🧬", "지원 & 채용", "‘채용’ 탭에서 AI 페르소나로 지원하고 직원을 합류시켜요."],
    ["🏛️", "회사 운영", "‘이사회’에서 안건을 의결하고, 직접 회사를 만들어 CEO가 되세요."],
  ];

  return (
    <section className="relative overflow-hidden rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/10 to-transparent p-5">
      <button
        onClick={dismiss}
        className="absolute right-3 top-3 rounded-lg px-2 py-0.5 text-xs text-muted hover:text-text focus-ring"
        aria-label="가이드 닫기"
      >
        ✕
      </button>
      <p className="mb-4 text-sm font-medium text-accent">
        👋 처음 오셨나요? 3단계로 시작해 보세요
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        {steps.map(([icon, title, desc], i) => (
          <div key={i} className="flex gap-3">
            <span className="text-2xl">{icon}</span>
            <div>
              <div className="text-sm font-medium">
                {i + 1}. {title}
              </div>
              <div className="text-xs text-muted">{desc}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
