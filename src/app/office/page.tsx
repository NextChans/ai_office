"use client";

import { useState } from "react";
import { OfficeFloor } from "@/components/OfficeFloor";
import { useOffice } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { StatusPill } from "@/components/StatusPill";

export default function OfficePage() {
  const hydrated = useHydrated();
  const company = useOffice((s) => s.company);
  const agents = useOffice((s) => s.agents);
  const actions = useOffice((s) => s.actions);
  const decideAction = useOffice((s) => s.decideAction);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!hydrated) {
    return <div className="py-20 text-center text-muted">오피스를 불러오는 중…</div>;
  }

  const selected = agents.find((a) => a.id === selectedId) ?? null;
  const selectedActions = selected
    ? actions.filter((a) => a.agentId === selected.id)
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{company.name} 오피스</h1>
          <p className="text-sm text-muted">{company.mission}</p>
        </div>
        <div className="flex gap-4 text-sm">
          <Stat label="에이전트" value={agents.length} />
          <Stat
            label="대기 액션"
            value={actions.filter((a) => a.status === "proposed").length}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <OfficeFloor selectedId={selectedId} onSelect={setSelectedId} />

        <aside className="rounded-2xl border border-border bg-panel p-5">
          {selected ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-panel-2 text-2xl">
                  {selected.avatar}
                </span>
                <div>
                  <h2 className="font-semibold">
                    {selected.name}
                    {selected.role === "CEO" && " 👑"}
                  </h2>
                  <p className="text-xs text-muted">
                    {selected.role} · {selected.department}
                  </p>
                </div>
              </div>
              <Row label="소유자" value={selected.ownerName} />
              <Row label="현재 상태" value={selected.status} />
              <Row
                label="승인 모드"
                value={selected.approvalMode === "auto" ? "자동 ⚡" : "수동 ✋"}
              />

              <div>
                <h3 className="mb-2 text-sm font-medium text-muted">최근 액션</h3>
                <div className="flex flex-col gap-2">
                  {selectedActions.length === 0 && (
                    <p className="text-xs text-muted">기록된 액션이 없습니다.</p>
                  )}
                  {selectedActions.map((a) => (
                    <div
                      key={a.id}
                      className="rounded-lg border border-border bg-panel-2 p-3 text-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{a.title}</span>
                        <StatusPill status={a.status} />
                      </div>
                      <p className="mt-1 text-xs text-muted">{a.detail}</p>
                      {a.status === "proposed" && (
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() => decideAction(a.id, "approved")}
                            className="rounded-md bg-accent-2/20 px-2 py-1 text-xs text-accent-2"
                          >
                            승인
                          </button>
                          <button
                            onClick={() => decideAction(a.id, "held")}
                            className="rounded-md bg-warn/20 px-2 py-1 text-xs text-warn"
                          >
                            보류
                          </button>
                          <button
                            onClick={() => decideAction(a.id, "cancelled")}
                            className="rounded-md bg-danger/20 px-2 py-1 text-xs text-danger"
                          >
                            취소
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-muted">
              에이전트를 클릭하면
              <br />
              상세 정보가 표시됩니다.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-panel px-4 py-2 text-center">
      <div className="text-lg font-bold text-accent">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
