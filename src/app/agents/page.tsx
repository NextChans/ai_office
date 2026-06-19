"use client";

import { useMemo, useState } from "react";
import { useOffice, useCurrentCompany } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { StatusPill } from "@/components/StatusPill";

type Tab = "applications" | "agents" | "actions";

export default function AgentsPage() {
  const hydrated = useHydrated();
  const [tab, setTab] = useState<Tab>("applications");

  const company = useCurrentCompany();
  const personas = useOffice((s) => s.personas);
  const allApplications = useOffice((s) => s.applications);
  const allAgents = useOffice((s) => s.agents);
  const allActions = useOffice((s) => s.actions);
  const decideApplication = useOffice((s) => s.decideApplication);
  const setApprovalMode = useOffice((s) => s.setApprovalMode);
  const decideAction = useOffice((s) => s.decideAction);
  const proposeAction = useOffice((s) => s.proposeAction);

  const cid = company?.id;
  const applications = useMemo(
    () => allApplications.filter((a) => a.companyId === cid),
    [allApplications, cid]
  );
  const agents = useMemo(
    () => allAgents.filter((a) => a.companyId === cid),
    [allAgents, cid]
  );
  const actions = useMemo(
    () => allActions.filter((a) => a.companyId === cid),
    [allActions, cid]
  );

  if (!hydrated) return null;

  const personaById = (id: string) => personas.find((p) => p.id === id);
  const agentById = (id: string) => agents.find((a) => a.id === id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">에이전트 & 채용 관리</h1>
        <p className="text-sm text-muted">
          <span className="text-text">{company?.name}</span> · 지원서를 검토하고,
          에이전트의 승인 정책과 행동을 관리합니다.
        </p>
      </div>

      <div className="flex gap-1 rounded-xl border border-border bg-panel p-1 text-sm">
        {(
          [
            ["applications", `지원서 (${applications.filter((a) => a.status === "pending").length})`],
            ["agents", `에이전트 (${agents.length})`],
            ["actions", `액션 (${actions.filter((a) => a.status === "proposed").length})`],
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

      {tab === "applications" && (
        <div className="grid gap-3">
          {applications.length === 0 && <Empty>아직 지원서가 없습니다.</Empty>}
          {applications.map((app) => {
            const p = personaById(app.personaId);
            if (!p) return null;
            return (
              <div
                key={app.id}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-panel p-5 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-panel-2 text-xl">
                    {p.avatar}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{p.name}</span>
                      <span className="text-xs text-muted">@{p.ownerName}</span>
                      <StatusPill status={appStatusToPill(app.status)} />
                    </div>
                    <p className="text-sm text-muted">{p.tagline}</p>
                    <p className="mt-1 text-xs text-muted">
                      {app.department} 지원 · “{app.message || "동기 미작성"}”
                    </p>
                    {p.skills.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {p.skills.map((s) => (
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
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => decideApplication(app.id, "hired")}
                      className="rounded-lg bg-accent-2/20 px-3 py-1.5 text-sm text-accent-2"
                    >
                      채용
                    </button>
                    <button
                      onClick={() => decideApplication(app.id, "rejected")}
                      className="rounded-lg bg-danger/20 px-3 py-1.5 text-sm text-danger"
                    >
                      불합격
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === "agents" && (
        <div className="grid gap-3 md:grid-cols-2">
          {agents.map((a) => (
            <div
              key={a.id}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-panel p-5"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-panel-2 text-xl">
                  {a.avatar}
                </span>
                <div>
                  <div className="font-semibold">
                    {a.name}
                    {a.role === "CEO" && " 👑"}
                  </div>
                  <div className="text-xs text-muted">
                    {a.role} · {a.department} · @{a.ownerName}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border bg-panel-2 p-3">
                <div className="text-sm">
                  <div className="font-medium">행동 승인 정책</div>
                  <div className="text-xs text-muted">
                    {a.approvalMode === "auto"
                      ? "에이전트 행동이 자동 승인됩니다."
                      : "소유자가 직접 승인합니다."}
                  </div>
                </div>
                <button
                  onClick={() =>
                    setApprovalMode(
                      a.id,
                      a.approvalMode === "auto" ? "manual" : "auto"
                    )
                  }
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    a.approvalMode === "auto" ? "bg-accent" : "bg-border"
                  }`}
                  aria-label="toggle approval mode"
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                      a.approvalMode === "auto" ? "left-[22px]" : "left-0.5"
                    }`}
                  />
                </button>
              </div>

              <button
                onClick={() =>
                  proposeAction(
                    a.id,
                    "신규 작업 제안",
                    `${a.name}이(가) ${a.department} 업무를 제안했습니다.`
                  )
                }
                className="rounded-lg border border-border bg-panel-2 px-3 py-2 text-sm text-muted hover:text-text"
              >
                + 액션 시뮬레이션
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === "actions" && (
        <div className="grid gap-3">
          {actions.length === 0 && <Empty>액션 기록이 없습니다.</Empty>}
          {actions.map((act) => {
            const a = agentById(act.agentId);
            return (
              <div
                key={act.id}
                className="flex flex-col gap-2 rounded-2xl border border-border bg-panel p-5 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span>{a?.avatar}</span>
                    <span className="font-medium">{act.title}</span>
                    <StatusPill status={act.status} />
                  </div>
                  <p className="mt-1 text-sm text-muted">{act.detail}</p>
                  <p className="text-xs text-muted">
                    제안자: {a?.name ?? "알 수 없음"}
                  </p>
                </div>
                {act.status === "proposed" && (
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => decideAction(act.id, "approved")}
                      className="rounded-lg bg-accent-2/20 px-3 py-1.5 text-sm text-accent-2"
                    >
                      승인
                    </button>
                    <button
                      onClick={() => decideAction(act.id, "held")}
                      className="rounded-lg bg-warn/20 px-3 py-1.5 text-sm text-warn"
                    >
                      보류
                    </button>
                    <button
                      onClick={() => decideAction(act.id, "cancelled")}
                      className="rounded-lg bg-danger/20 px-3 py-1.5 text-sm text-danger"
                    >
                      취소
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function appStatusToPill(status: string) {
  return {
    pending: "proposed",
    hired: "approved",
    rejected: "cancelled",
    interview: "held",
  }[status] ?? status;
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-panel/50 py-12 text-center text-sm text-muted">
      {children}
    </div>
  );
}
