"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useOffice } from "@/lib/store";
import { toast } from "@/components/ui/toast";
import type { VoteChoice } from "@/lib/types";

export default function BoardPage() {
  const { id } = useParams<{ id: string }>();
  const companies = useOffice((s) => s.companies);
  const allAgents = useOffice((s) => s.agents);
  const allMeetings = useOffice((s) => s.meetings);
  const proposals = useOffice((s) => s.proposals);
  const castVote = useOffice((s) => s.castVote);
  const resolveProposal = useOffice((s) => s.resolveProposal);

  const company = companies.find((c) => c.id === id);
  const agents = useMemo(
    () => allAgents.filter((a) => a.companyId === id),
    [allAgents, id]
  );
  const meetings = useMemo(
    () => allMeetings.filter((m) => m.companyId === id),
    [allMeetings, id]
  );

  const ceo = agents.find((a) => a.id === company?.ceoAgentId);
  const boardMembers = agents.filter(
    (a) => a.role === "CEO" || a.role === "CTO" || a.role === "Manager"
  );
  const agentById = (aid?: string) =>
    aid ? agents.find((a) => a.id === aid) : undefined;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-3">
        <div className="rounded-xl border border-accent/40 bg-accent/10 px-4 py-3">
          <div className="text-xs text-muted">현재 CEO</div>
          <div className="font-semibold">
            {ceo ? `${ceo.avatar} ${ceo.name}` : "공석"} 👑
          </div>
        </div>
        <div className="rounded-xl border border-border bg-panel px-4 py-3">
          <div className="text-xs text-muted">의결권 멤버</div>
          <div className="font-semibold">{boardMembers.length}명</div>
        </div>
      </div>

      {meetings.map((m) => {
        const items = proposals.filter((p) => p.meetingId === m.id);
        return (
          <div key={m.id} className="rounded-2xl border border-border bg-panel p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{m.title}</h2>
              <span className="text-xs text-muted">
                {new Date(m.createdAt).toLocaleDateString("ko-KR")}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted">{m.agenda}</p>

            <div className="mt-5 flex flex-col gap-4">
              {items.length === 0 && (
                <p className="text-sm text-muted">등록된 안건이 없습니다.</p>
              )}
              {items.map((p) => {
                const target = agentById(p.targetAgentId);
                const forCount = Object.values(p.votes).filter((v) => v === "for").length;
                const againstCount = Object.values(p.votes).filter(
                  (v) => v === "against"
                ).length;
                return (
                  <div key={p.id} className="rounded-xl border border-border bg-panel-2 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-accent/20 px-2 py-0.5 text-[11px] text-accent">
                            {kindLabel(p.kind)}
                          </span>
                          {p.resolved && (
                            <span
                              className={`rounded-md px-2 py-0.5 text-[11px] ${
                                p.passed
                                  ? "bg-accent-2/20 text-accent-2"
                                  : "bg-danger/20 text-danger"
                              }`}
                            >
                              {p.passed ? "가결" : "부결"}
                            </span>
                          )}
                        </div>
                        <p className="mt-1.5 text-sm">{p.description}</p>
                        {target && (
                          <p className="text-xs text-muted">
                            대상: {target.avatar} {target.name}
                          </p>
                        )}
                      </div>
                      <div className="text-right text-xs text-muted">
                        <div className="text-accent-2">찬성 {forCount}</div>
                        <div className="text-danger">반대 {againstCount}</div>
                      </div>
                    </div>

                    {!p.resolved && (
                      <div className="mt-3 flex flex-col gap-2">
                        <div className="text-xs text-muted">의결권 투표</div>
                        <div className="flex flex-wrap gap-2">
                          {boardMembers.map((bm) => (
                            <div
                              key={bm.id}
                              className="flex items-center gap-1 rounded-lg border border-border bg-panel px-2 py-1"
                            >
                              <span className="text-sm">{bm.avatar}</span>
                              <span className="text-xs">{bm.name}</span>
                              <VoteButtons
                                current={p.votes[bm.id]}
                                onVote={(c) => castVote(p.id, bm.id, c)}
                              />
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => {
                            const f = Object.values(p.votes).filter((v) => v === "for").length;
                            const ag = Object.values(p.votes).filter((v) => v === "against").length;
                            resolveProposal(p.id);
                            toast[f > ag ? "success" : "warn"](
                              f > ag ? "안건이 가결되었습니다 ✅" : "안건이 부결되었습니다."
                            );
                          }}
                          className="mt-2 self-start rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white focus-ring"
                        >
                          안건 의결
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <NewMeeting companyId={id} />
    </div>
  );
}

function VoteButtons({
  current,
  onVote,
}: {
  current?: VoteChoice;
  onVote: (c: VoteChoice) => void;
}) {
  const opts: [VoteChoice, string][] = [
    ["for", "👍"],
    ["against", "👎"],
    ["abstain", "✋"],
  ];
  return (
    <div className="flex gap-0.5">
      {opts.map(([c, icon]) => (
        <button
          key={c}
          onClick={() => onVote(c)}
          className={`grid h-6 w-6 place-items-center rounded text-xs ${
            current === c ? "bg-accent/30" : "hover:bg-panel-2"
          }`}
        >
          {icon}
        </button>
      ))}
    </div>
  );
}

function NewMeeting({ companyId }: { companyId: string }) {
  const createMeeting = useOffice((s) => s.createMeeting);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [agenda, setAgenda] = useState("");

  return (
    <div className="rounded-2xl border border-dashed border-border bg-panel/50 p-6">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full text-sm text-muted hover:text-text"
        >
          + 새 이사회 소집
        </button>
      ) : (
        <div className="flex flex-col gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="이사회 제목 (예: 2026 Q3 정기 이사회)"
            className="rounded-lg border border-border bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <textarea
            value={agenda}
            onChange={(e) => setAgenda(e.target.value)}
            rows={2}
            placeholder="안건을 입력하세요"
            className="resize-none rounded-lg border border-border bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (!title) return;
                createMeeting(companyId, title, agenda);
                toast.success("새 이사회를 소집했습니다.");
                setTitle("");
                setAgenda("");
                setOpen(false);
              }}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white"
            >
              소집
            </button>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function kindLabel(kind: string) {
  return (
    { replace_ceo: "CEO 교체", promote: "승진", custom: "일반 안건" }[kind] ?? kind
  );
}
