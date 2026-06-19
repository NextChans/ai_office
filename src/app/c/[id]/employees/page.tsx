"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useOffice } from "@/lib/store";
import { StatusPill } from "@/components/StatusPill";
import { EmptyState, Modal } from "@/components/ui";
import { toast } from "@/components/ui/toast";
import type { Agent } from "@/lib/types";

type Tab = "roster" | "actions";

export default function EmployeesPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<Tab>("roster");
  const [profileId, setProfileId] = useState<string | null>(null);

  const allAgents = useOffice((s) => s.agents);
  const allActions = useOffice((s) => s.actions);
  const personas = useOffice((s) => s.personas);
  const setApprovalMode = useOffice((s) => s.setApprovalMode);
  const decideAction = useOffice((s) => s.decideAction);
  const proposeAction = useOffice((s) => s.proposeAction);

  const agents = useMemo(
    () => allAgents.filter((a) => a.companyId === id),
    [allAgents, id]
  );
  const actions = useMemo(
    () => allActions.filter((a) => a.companyId === id),
    [allActions, id]
  );
  const agentById = (aid: string) => agents.find((a) => a.id === aid);
  const pending = actions.filter((a) => a.status === "proposed").length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-1 rounded-xl border border-border bg-panel p-1 text-sm">
        {(
          [
            ["roster", `직원 (${agents.length})`],
            ["actions", `액션 승인 (${pending})`],
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

      {tab === "roster" && (
        <div className="grid gap-3 md:grid-cols-2">
          {agents.length === 0 && (
            <EmptyState
              icon="🪑"
              title="아직 직원이 없습니다"
              description="‘채용’ 탭에서 AI 페르소나를 채용해 오피스에 합류시켜 보세요."
            />
          )}
          {agents.map((a) => (
            <div
              key={a.id}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-panel p-5"
            >
              <button
                onClick={() => setProfileId(a.id)}
                className="flex items-center gap-3 text-left focus-ring rounded-lg"
              >
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
                <span className="ml-auto text-xs text-muted">프로필 ›</span>
              </button>

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
                  onClick={() => {
                    const next = a.approvalMode === "auto" ? "manual" : "auto";
                    setApprovalMode(a.id, next);
                    toast.info(
                      `${a.name}: 승인 정책 → ${next === "auto" ? "자동 ⚡" : "수동 ✋"}`
                    );
                  }}
                  className={`relative h-6 w-11 rounded-full transition-colors focus-ring ${
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
                onClick={() => {
                  proposeAction(
                    a.id,
                    "신규 작업 제안",
                    `${a.name}이(가) ${a.department} 업무를 제안했습니다.`
                  );
                  toast.info(
                    a.approvalMode === "auto"
                      ? `${a.name}의 액션이 자동 승인되었습니다 ⚡`
                      : `${a.name}이(가) 액션을 제안했습니다. 검토해 주세요.`
                  );
                }}
                className="rounded-lg border border-border bg-panel-2 px-3 py-2 text-sm text-muted hover:text-text focus-ring"
              >
                + 액션 시뮬레이션
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === "actions" && (
        <div className="grid gap-3">
          {actions.length === 0 && (
            <EmptyState
              icon="📋"
              title="액션 기록이 없습니다"
              description="직원 탭에서 ‘액션 시뮬레이션’으로 에이전트 행동을 만들어 보세요."
            />
          )}
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
                  <p className="text-xs text-muted">제안자: {a?.name ?? "—"}</p>
                </div>
                {act.status === "proposed" && (
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => {
                        decideAction(act.id, "approved");
                        toast.success("액션을 승인했습니다.");
                      }}
                      className="rounded-lg bg-accent-2/20 px-3 py-1.5 text-sm text-accent-2 focus-ring"
                    >
                      승인
                    </button>
                    <button
                      onClick={() => {
                        decideAction(act.id, "held");
                        toast.warn("액션을 보류했습니다.");
                      }}
                      className="rounded-lg bg-warn/20 px-3 py-1.5 text-sm text-warn focus-ring"
                    >
                      보류
                    </button>
                    <button
                      onClick={() => {
                        decideAction(act.id, "cancelled");
                        toast.error("액션을 취소했습니다.");
                      }}
                      className="rounded-lg bg-danger/20 px-3 py-1.5 text-sm text-danger focus-ring"
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

      <AgentProfile
        agent={agents.find((a) => a.id === profileId) ?? null}
        actions={actions}
        persona={(() => {
          const ag = agents.find((a) => a.id === profileId);
          return ag ? personas.find((p) => p.id === ag.personaId) ?? null : null;
        })()}
        onClose={() => setProfileId(null)}
      />
    </div>
  );
}

function AgentProfile({
  agent,
  persona,
  actions,
  onClose,
}: {
  agent: Agent | null;
  persona: { bio: string; tagline: string; skills: string[] } | null;
  actions: { agentId: string; title: string; status: string }[];
  onClose: () => void;
}) {
  if (!agent) return null;
  const history = actions.filter((a) => a.agentId === agent.id);
  return (
    <Modal open={!!agent} onClose={onClose}>
      <div className="flex items-center gap-4">
        <span className="grid h-16 w-16 place-items-center rounded-2xl bg-panel-2 text-3xl">
          {agent.avatar}
        </span>
        <div>
          <h2 className="text-lg font-semibold">
            {agent.name}
            {agent.role === "CEO" && " 👑"}
          </h2>
          <p className="text-sm text-muted">
            {agent.role} · {agent.department}
          </p>
          {persona?.tagline && (
            <p className="mt-0.5 text-xs text-muted">“{persona.tagline}”</p>
          )}
        </div>
      </div>

      {persona && persona.skills.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {persona.skills.map((s) => (
            <span
              key={s}
              className="rounded-full border border-border bg-panel-2 px-2.5 py-0.5 text-xs text-muted"
            >
              {s}
            </span>
          ))}
        </div>
      )}

      {persona?.bio && (
        <p className="mt-3 text-sm leading-relaxed text-muted">{persona.bio}</p>
      )}

      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
        <Stat label="소유자" value={agent.ownerName} />
        <Stat
          label="승인"
          value={agent.approvalMode === "auto" ? "자동" : "수동"}
        />
        <Stat label="액션" value={String(history.length)} />
      </div>

      <p className="mt-4 text-xs text-muted">현재 상태 · {agent.status}</p>
    </Modal>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-panel-2 px-2 py-2">
      <div className="truncate font-medium">{value}</div>
      <div className="text-[11px] text-muted">{label}</div>
    </div>
  );
}
