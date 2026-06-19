"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useOffice } from "@/lib/store";
import { StatusPill } from "@/components/StatusPill";

type Tab = "roster" | "actions";

export default function EmployeesPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<Tab>("roster");

  const allAgents = useOffice((s) => s.agents);
  const allActions = useOffice((s) => s.actions);
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
            <Empty>아직 직원이 없습니다. 채용 탭에서 합류시켜 보세요.</Empty>
          )}
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
                  <p className="text-xs text-muted">제안자: {a?.name ?? "—"}</p>
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

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="col-span-full rounded-2xl border border-dashed border-border bg-panel/50 py-12 text-center text-sm text-muted">
      {children}
    </div>
  );
}
