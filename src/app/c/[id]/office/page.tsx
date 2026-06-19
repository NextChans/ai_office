"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { OfficeFloor } from "@/components/OfficeFloor";
import { useOffice } from "@/lib/store";
import { StatusPill } from "@/components/StatusPill";

export default function OfficePage() {
  const { id } = useParams<{ id: string }>();
  const allAgents = useOffice((s) => s.agents);
  const allActions = useOffice((s) => s.actions);
  const decideAction = useOffice((s) => s.decideAction);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const agents = useMemo(
    () => allAgents.filter((a) => a.companyId === id),
    [allAgents, id]
  );
  const actions = useMemo(
    () => allActions.filter((a) => a.companyId === id),
    [allActions, id]
  );

  const selected = agents.find((a) => a.id === selectedId) ?? null;
  const selectedActions = selected
    ? actions.filter((a) => a.agentId === selected.id)
    : [];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <OfficeFloor
        selectedId={selectedId}
        onSelect={setSelectedId}
        companyId={id}
      />

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
            오피스의 직원을 클릭하면
            <br />
            상세 정보가 표시됩니다.
          </div>
        )}
      </aside>
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
