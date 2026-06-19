"use client";

import { useEffect, useMemo, useState } from "react";
import { useOffice } from "@/lib/store";
import type { Agent, Department } from "@/lib/types";

const GRID_W = 11;
const GRID_H = 9;
const TILE = 64;

// Department zones colour the floor so the office reads as rooms.
const ZONES: { dept: Department; x: [number, number]; y: [number, number]; color: string; label: string }[] = [
  { dept: "Executive", x: [4, 7], y: [1, 3], color: "rgba(124,108,255,0.18)", label: "경영진" },
  { dept: "Engineering", x: [1, 4], y: [4, 8], color: "rgba(56,232,198,0.14)", label: "엔지니어링" },
  { dept: "Design", x: [7, 10], y: [4, 6], color: "rgba(255,177,61,0.14)", label: "디자인" },
  { dept: "Marketing", x: [5, 9], y: [6, 8], color: "rgba(255,93,108,0.13)", label: "마케팅" },
];

function isoStyle(x: number, y: number): React.CSSProperties {
  // 2:1 isometric projection.
  const isoX = (x - y) * (TILE / 2);
  const isoY = (x + y) * (TILE / 4);
  return {
    position: "absolute",
    left: `${isoX}px`,
    top: `${isoY}px`,
  };
}

function zoneFor(x: number, y: number) {
  return ZONES.find(
    (z) => x >= z.x[0] && x <= z.x[1] && y >= z.y[0] && y <= z.y[1]
  );
}

export function OfficeFloor({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const allAgents = useOffice((s) => s.agents);
  const currentCompanyId = useOffice((s) => s.currentCompanyId);
  const moveAgent = useOffice((s) => s.moveAgent);
  const [tick, setTick] = useState(0);

  const agents = useMemo(
    () => allAgents.filter((a) => a.companyId === currentCompanyId),
    [allAgents, currentCompanyId]
  );

  // Gentle autonomous wandering to make the office feel alive.
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 2600);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (tick === 0) return;
    const a = agents[Math.floor(Math.random() * agents.length)];
    if (!a || a.role === "CEO") return;
    const dx = [-1, 0, 1][Math.floor(Math.random() * 3)];
    const dy = [-1, 0, 1][Math.floor(Math.random() * 3)];
    const nx = Math.min(GRID_W - 1, Math.max(0, a.x + dx));
    const ny = Math.min(GRID_H - 1, Math.max(0, a.y + dy));
    if (nx !== a.x || ny !== a.y) moveAgent(a.id, nx, ny);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  const tiles = useMemo(() => {
    const list: { x: number; y: number }[] = [];
    for (let y = 0; y < GRID_H; y++)
      for (let x = 0; x < GRID_W; x++) list.push({ x, y });
    return list;
  }, []);

  const boardW = (GRID_W + GRID_H) * (TILE / 2);
  const boardH = (GRID_W + GRID_H) * (TILE / 4) + TILE;

  return (
    <div className="relative overflow-auto rounded-2xl border border-border bg-bg-soft p-8">
      <div
        className="relative mx-auto"
        style={{ width: boardW, height: boardH, transform: "translateX(0)" }}
      >
        <div
          className="absolute"
          style={{ left: GRID_H * (TILE / 2), top: 0 }}
        >
          {tiles.map(({ x, y }) => {
            const zone = zoneFor(x, y);
            return (
              <div
                key={`${x}-${y}`}
                style={{
                  ...isoStyle(x, y),
                  width: TILE,
                  height: TILE / 2,
                  background: zone ? zone.color : "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  transform: "rotate(0deg)",
                  clipPath: "polygon(50% 0, 100% 50%, 50% 100%, 0 50%)",
                }}
              />
            );
          })}

          {[...agents]
            .sort((a, b) => a.x + a.y - (b.x + b.y))
            .map((agent) => (
              <AgentToken
                key={agent.id}
                agent={agent}
                selected={agent.id === selectedId}
                onSelect={() => onSelect(agent.id)}
              />
            ))}
        </div>
      </div>
    </div>
  );
}

function AgentToken({
  agent,
  selected,
  onSelect,
}: {
  agent: Agent;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className="group absolute flex -translate-x-1/2 -translate-y-full flex-col items-center"
      style={{
        ...isoStyle(agent.x, agent.y),
        marginLeft: TILE / 2,
        marginTop: TILE / 4,
        transition: "left 0.6s ease, top 0.6s ease",
        zIndex: agent.x + agent.y + 10,
      }}
    >
      <span className="mb-1 whitespace-nowrap rounded-md bg-panel-2/90 px-1.5 py-0.5 text-[10px] text-muted opacity-0 transition-opacity group-hover:opacity-100">
        {agent.status}
      </span>
      <span
        className={`bob grid h-11 w-11 place-items-center rounded-full border text-xl ${
          selected
            ? "border-accent bg-accent/30"
            : "border-border bg-panel"
        }`}
        style={selected ? { animation: "pulse-ring 1.6s infinite" } : undefined}
      >
        {agent.avatar}
      </span>
      <span className="mt-1 rounded bg-bg/70 px-1.5 text-[11px] font-medium">
        {agent.name}
        {agent.role === "CEO" && " 👑"}
      </span>
    </button>
  );
}
