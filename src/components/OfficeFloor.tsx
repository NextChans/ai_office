"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useOffice } from "@/lib/store";
import type { Agent, Department } from "@/lib/types";

const GRID_W = 10;
const GRID_H = 8;
const TILE = 66;
const Q = TILE / 4;
const H = TILE / 2;
const WALL_H = 64;
const VOFF = WALL_H; // push the floor down to make room for the walls
const XOFF = GRID_H * H; // shift so the left-most tile starts at x = 0

// ---------------------------------------------------------------------------
// Coordinate helpers (screen space, already offset so nothing is negative).
// ---------------------------------------------------------------------------
const cx = (x: number, y: number) => (x - y) * H + XOFF;
const cy = (x: number, y: number) => (x + y) * Q + VOFF + Q;

// Horizontal span is [-(GRID_H-1)*H - H, (GRID_W-1)*H + H]; XOFF shifts it to 0.
const BOARD_W = (GRID_W + GRID_H) * H;
const BOARD_H = (GRID_W + GRID_H) * Q + TILE + VOFF;

// ---------------------------------------------------------------------------
// Department theming.
// ---------------------------------------------------------------------------
type Zone = {
  dept: Department;
  x: [number, number];
  y: [number, number];
  carpet: string;
  shirt: string;
  label: string;
};

const ZONES: Zone[] = [
  { dept: "Executive", x: [3, 6], y: [0, 1], carpet: "#3a3566", shirt: "#8b7bff", label: "경영진 · 회의실" },
  { dept: "Engineering", x: [0, 3], y: [3, 6], carpet: "#1f4a45", shirt: "#2fd6b6", label: "엔지니어링" },
  { dept: "Design", x: [6, 9], y: [3, 5], carpet: "#4d3a1c", shirt: "#ffb13d", label: "디자인" },
  { dept: "Marketing", x: [5, 8], y: [6, 7], carpet: "#4d2630", shirt: "#ff6b7d", label: "마케팅" },
];

function zoneFor(x: number, y: number) {
  return ZONES.find(
    (z) => x >= z.x[0] && x <= z.x[1] && y >= z.y[0] && y <= z.y[1]
  );
}
function shirtFor(dept: Department) {
  return ZONES.find((z) => z.dept === dept)?.shirt ?? "#5b9dff";
}

// Furniture placed on the floor (depth-sorted with the room).
type Furniture =
  | { type: "desk"; x: number; y: number; tint: string }
  | { type: "meeting"; x: number; y: number }
  | { type: "sofa"; x: number; y: number }
  | { type: "plant"; x: number; y: number }
  | { type: "cooler"; x: number; y: number };

const FURNITURE: Furniture[] = [
  // Executive meeting room
  { type: "meeting", x: 4, y: 1 },
  // Engineering desks
  { type: "desk", x: 1, y: 4, tint: "#2fd6b6" },
  { type: "desk", x: 0, y: 5, tint: "#2fd6b6" },
  { type: "desk", x: 2, y: 6, tint: "#2fd6b6" },
  // Design desks
  { type: "desk", x: 7, y: 4, tint: "#ffb13d" },
  { type: "desk", x: 8, y: 5, tint: "#ffb13d" },
  // Marketing desks
  { type: "desk", x: 6, y: 7, tint: "#ff6b7d" },
  { type: "desk", x: 7, y: 6, tint: "#ff6b7d" },
  // Lounge & decor
  { type: "sofa", x: 4, y: 6 },
  { type: "cooler", x: 9, y: 6 },
  { type: "plant", x: 0, y: 7 },
  { type: "plant", x: 9, y: 0 },
  { type: "plant", x: 9, y: 7 },
];

// Casual chatter shown as speech bubbles to make the office feel alive.
const CHATTER = [
  "오늘 점심 뭐 먹지? 🍜",
  "이번 스프린트 거의 끝났어!",
  "커피 한 잔 하실 분 ☕",
  "방금 배포 성공했어요 🎉",
  "이 디자인 진짜 예쁘다",
  "버그 하나 잡았다 🐛",
  "고객 반응 너무 좋아요!",
  "회의 끝나고 산책 갈래요?",
  "주말 잘 보냈어요?",
  "데모 영상 공유했어요",
  "오늘도 화이팅 💪",
  "그 기능 내가 맡을게요",
  "리뷰 부탁드려요 🙏",
  "와 이거 천재적인데?",
];

// ===========================================================================
export function OfficeFloor({
  selectedId,
  onSelect,
  companyId,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
  companyId?: string;
}) {
  const allAgents = useOffice((s) => s.agents);
  const currentCompanyId = useOffice((s) => s.currentCompanyId);
  const moveAgent = useOffice((s) => s.moveAgent);
  const scopeId = companyId ?? currentCompanyId;

  const agents = useMemo(
    () => allAgents.filter((a) => a.companyId === scopeId),
    [allAgents, scopeId]
  );

  // Keep a live reference so the intervals always see the latest agents.
  const agentsRef = useRef(agents);
  agentsRef.current = agents;

  // --- Autonomous wandering -------------------------------------------------
  useEffect(() => {
    const t = setInterval(() => {
      const list = agentsRef.current.filter((a) => a.role !== "CEO");
      if (list.length === 0) return;
      const a = list[Math.floor(Math.random() * list.length)];
      const dx = [-1, 0, 1][Math.floor(Math.random() * 3)];
      const dy = [-1, 0, 1][Math.floor(Math.random() * 3)];
      const nx = Math.min(GRID_W - 1, Math.max(0, a.x + dx));
      const ny = Math.min(GRID_H - 1, Math.max(0, a.y + dy));
      if (nx !== a.x || ny !== a.y) moveAgent(a.id, nx, ny);
    }, 2400);
    return () => clearInterval(t);
  }, [moveAgent]);

  // --- Speech-bubble chatter ------------------------------------------------
  const [bubbles, setBubbles] = useState<Record<string, string>>({});
  useEffect(() => {
    const t = setInterval(() => {
      const list = agentsRef.current;
      if (list.length === 0) return;
      const a = list[Math.floor(Math.random() * list.length)];
      const line = CHATTER[Math.floor(Math.random() * CHATTER.length)];
      setBubbles((prev) => ({ ...prev, [a.id]: line }));
      window.setTimeout(() => {
        setBubbles((prev) => {
          const next = { ...prev };
          delete next[a.id];
          return next;
        });
      }, 3400);
    }, 2100);
    return () => clearInterval(t);
  }, []);

  const tiles = useMemo(() => {
    const list: { x: number; y: number }[] = [];
    for (let y = 0; y < GRID_H; y++)
      for (let x = 0; x < GRID_W; x++) list.push({ x, y });
    return list;
  }, []);

  const backCorner = { x: cx(0, 0), y: cy(0, 0) - Q };
  const rightCorner = { x: cx(GRID_W - 1, 0) + H, y: cy(GRID_W - 1, 0) };
  const leftCorner = { x: cx(0, GRID_H - 1) - H, y: cy(0, GRID_H - 1) };

  return (
    <div className="relative overflow-auto rounded-2xl border border-border bg-gradient-to-b from-[#15131f] to-[#0d0c14] p-6">
      <div className="relative mx-auto" style={{ width: BOARD_W, height: BOARD_H }}>
        {/* ---- Static room: walls, floor, furniture (one SVG) ---- */}
        <svg
          width={BOARD_W}
          height={BOARD_H}
          viewBox={`0 0 ${BOARD_W} ${BOARD_H}`}
          className="absolute left-0 top-0"
          shapeRendering="crispEdges"
        >
          <defs>
            <linearGradient id="wallL" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#2c2a3f" />
              <stop offset="1" stopColor="#222032" />
            </linearGradient>
            <linearGradient id="wallR" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#26243a" />
              <stop offset="1" stopColor="#1c1b2b" />
            </linearGradient>
          </defs>

          {/* Left wall */}
          <polygon
            points={`${backCorner.x},${backCorner.y} ${leftCorner.x},${leftCorner.y} ${leftCorner.x},${leftCorner.y - WALL_H} ${backCorner.x},${backCorner.y - WALL_H}`}
            fill="url(#wallL)"
            stroke="#33304a"
          />
          {/* Right wall */}
          <polygon
            points={`${backCorner.x},${backCorner.y} ${rightCorner.x},${rightCorner.y} ${rightCorner.x},${rightCorner.y - WALL_H} ${backCorner.x},${backCorner.y - WALL_H}`}
            fill="url(#wallR)"
            stroke="#33304a"
          />
          {/* Windows on the walls */}
          {[0.32, 0.62].map((t, i) => {
            const wx = backCorner.x + (leftCorner.x - backCorner.x) * t;
            const wy = backCorner.y + (leftCorner.y - backCorner.y) * t;
            return (
              <polygon
                key={`wl${i}`}
                points={`${wx},${wy - 14} ${wx + 26},${wy - 1} ${wx + 26},${wy - 35} ${wx},${wy - 48}`}
                fill="#6fd3ff"
                opacity={0.18}
                stroke="#7fdcff"
                strokeOpacity={0.3}
              />
            );
          })}
          {[0.34, 0.66].map((t, i) => {
            const wx = backCorner.x + (rightCorner.x - backCorner.x) * t;
            const wy = backCorner.y + (rightCorner.y - backCorner.y) * t;
            return (
              <polygon
                key={`wr${i}`}
                points={`${wx},${wy - 14} ${wx - 26},${wy - 1} ${wx - 26},${wy - 35} ${wx},${wy - 48}`}
                fill="#6fd3ff"
                opacity={0.16}
                stroke="#7fdcff"
                strokeOpacity={0.28}
              />
            );
          })}

          {/* Floor tiles */}
          {tiles.map(({ x, y }) => {
            const zone = zoneFor(x, y);
            const fill = zone ? zone.carpet : (x + y) % 2 === 0 ? "#1b1a28" : "#181725";
            const ccx = cx(x, y);
            const ccy = cy(x, y);
            return (
              <polygon
                key={`${x}-${y}`}
                points={`${ccx},${ccy - Q} ${ccx + H},${ccy} ${ccx},${ccy + Q} ${ccx - H},${ccy}`}
                fill={fill}
                stroke="rgba(255,255,255,0.045)"
              />
            );
          })}

          {/* Furniture (painter's order: back to front) */}
          {[...FURNITURE]
            .sort((a, b) => a.x + a.y - (b.x + b.y))
            .map((f, i) => (
              <g key={i} transform={`translate(${cx(f.x, f.y)},${cy(f.x, f.y)})`}>
                {f.type === "desk" && <Desk tint={f.tint} />}
                {f.type === "meeting" && <MeetingTable />}
                {f.type === "sofa" && <Sofa />}
                {f.type === "plant" && <Plant />}
                {f.type === "cooler" && <Cooler />}
              </g>
            ))}
        </svg>

        {/* ---- Room labels ---- */}
        {ZONES.map((z) => {
          const mx = (z.x[0] + z.x[1]) / 2;
          const my = (z.y[0] + z.y[1]) / 2;
          return (
            <div
              key={z.dept}
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/35 px-2 py-0.5 text-[10px] font-medium text-white/70 backdrop-blur-sm"
              style={{ left: cx(mx, my), top: cy(mx, my) }}
            >
              {z.label}
            </div>
          );
        })}

        {/* ---- Characters (DOM layer, with movement transitions) ---- */}
        {[...agents]
          .sort((a, b) => a.x + a.y - (b.x + b.y))
          .map((agent) => (
            <Character
              key={agent.id}
              agent={agent}
              selected={agent.id === selectedId}
              bubble={bubbles[agent.id]}
              onSelect={() => onSelect(agent.id)}
            />
          ))}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-muted">
        {ZONES.map((z) => (
          <span key={z.dept} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ background: z.shirt }}
            />
            {z.dept}
          </span>
        ))}
      </div>
    </div>
  );
}

// ===========================================================================
// Cute 2.5D character
// ===========================================================================
function Character({
  agent,
  selected,
  bubble,
  onSelect,
}: {
  agent: Agent;
  selected: boolean;
  bubble?: string;
  onSelect: () => void;
}) {
  const shirt = shirtFor(agent.department);
  const dark = shade(shirt, -0.25);
  return (
    <button
      onClick={onSelect}
      className="group absolute flex flex-col items-center"
      style={{
        left: cx(agent.x, agent.y),
        top: cy(agent.x, agent.y),
        transform: "translate(-50%, -82%)",
        transition: "left 0.7s ease-in-out, top 0.7s ease-in-out",
        zIndex: Math.round(agent.x + agent.y) * 10 + 500,
      }}
    >
      {/* Speech bubble */}
      {bubble && (
        <span className="absolute -top-9 z-10 whitespace-nowrap rounded-xl border border-black/10 bg-white px-2.5 py-1 text-[11px] font-medium text-gray-800 shadow-lg">
          {bubble}
          <span className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-white" />
        </span>
      )}

      <span className="bob block">
        {/* Blocky, Minecraft-style character (hard pixel edges) */}
        <svg width="52" height="62" viewBox="0 0 52 62" shapeRendering="crispEdges">
          {/* shadow */}
          <rect x="13" y="56" width="26" height="5" fill="#000" opacity="0.25" />
          {/* legs */}
          <rect x="19" y="47" width="6" height="10" fill={dark} />
          <rect x="27" y="47" width="6" height="10" fill={dark} />
          {/* body (block torso) */}
          <rect x="16" y="32" width="20" height="17" fill={shirt} />
          <rect x="16" y="32" width="20" height="3" fill="#ffffff" opacity="0.14" />
          {/* arms */}
          <rect x="11" y="33" width="5" height="13" fill={dark} />
          <rect x="36" y="33" width="5" height="13" fill={dark} />
          {/* head (square block) */}
          <rect
            x="13"
            y="6"
            width="26"
            height="26"
            fill="#ffd9a8"
            stroke={selected ? "var(--accent)" : "var(--ink)"}
            strokeWidth={selected ? 3 : 2}
          />
          {/* face = chosen avatar emoji */}
          <text x="26" y="27" fontSize="16" textAnchor="middle">
            {agent.avatar}
          </text>
          {/* CEO crown */}
          {agent.role === "CEO" && (
            <text x="26" y="5" fontSize="13" textAnchor="middle">
              👑
            </text>
          )}
        </svg>
      </span>

      {/* Name tag */}
      <span className="mt-0.5 rounded-md bg-black/55 px-1.5 py-px text-[10px] font-medium text-white">
        {agent.name}
      </span>
      {/* Status on hover */}
      <span className="mt-0.5 max-w-[120px] truncate rounded bg-panel-2/95 px-1.5 text-[9px] text-muted opacity-0 transition-opacity group-hover:opacity-100">
        {agent.status}
      </span>
    </button>
  );
}

// ===========================================================================
// Furniture sprites (origin = base centre of the tile, +y is down)
// ===========================================================================
function Desk({ tint }: { tint: string }) {
  const top = "#6b5234";
  const left = "#4c3a25";
  const right = "#5a4530";
  return (
    <g>
      {/* chair (behind) */}
      <g transform="translate(0,-26)">
        <polygon points="0,-7 11,0 0,7 -11,0" fill="#3a3b50" />
        <polygon points="-11,0 0,7 0,14 -11,7" fill="#2c2d40" />
        <polygon points="11,0 0,7 0,14 11,7" fill="#33344a" />
        <rect x="-3" y="-20" width="7" height="14" rx="2" fill="#3a3b50" />
      </g>
      {/* desk top */}
      <polygon points="0,-24 28,-10 0,4 -28,-10" fill={top} />
      <polygon points="-28,-10 0,4 0,16 -28,2" fill={left} />
      <polygon points="28,-10 0,4 0,16 28,2" fill={right} />
      {/* monitor */}
      <g transform="translate(-7,-16)">
        <polygon points="0,-13 12,-7 12,2 0,-4" fill="#15151f" />
        <polygon points="0,-11 10,-6 10,0 0,-5" fill={tint} opacity="0.85" />
        <polygon points="3,-3 6,-1.5 6,2 3,0.5" fill="#222" />
      </g>
      {/* coffee cup */}
      <ellipse cx="13" cy="-8" rx="3.2" ry="1.8" fill="#d9b38c" />
      <rect x="9.8" y="-9" width="6.4" height="3.5" rx="1.5" fill="#e8c9a0" />
    </g>
  );
}

function MeetingTable() {
  return (
    <g>
      {/* table */}
      <ellipse cx="0" cy="-6" rx="40" ry="20" fill="#5a4530" />
      <ellipse cx="0" cy="-9" rx="40" ry="20" fill="#6b5234" />
      <ellipse cx="0" cy="-9" rx="33" ry="15" fill="#7a5f3c" />
      {/* chairs around */}
      {[
        [-40, -10],
        [40, -10],
        [-22, -22],
        [22, -22],
        [-22, 6],
        [22, 6],
      ].map(([dx, dy], i) => (
        <g key={i} transform={`translate(${dx},${dy})`}>
          <polygon points="0,-6 9,0 0,6 -9,0" fill="#3a3b50" />
          <polygon points="-9,0 0,6 0,12 -9,6" fill="#2c2d40" />
          <polygon points="9,0 0,6 0,12 9,6" fill="#33344a" />
        </g>
      ))}
    </g>
  );
}

function Sofa() {
  return (
    <g>
      {/* base */}
      <polygon points="0,-16 30,-1 0,14 -30,-1" fill="#3a6f68" />
      <polygon points="-30,-1 0,14 0,24 -30,9" fill="#2c554f" />
      <polygon points="30,-1 0,14 0,24 30,9" fill="#346159" />
      {/* back cushion */}
      <polygon points="-30,-1 0,-16 0,-30 -30,-15" fill="#41817a" />
      {/* seat cushions */}
      <ellipse cx="-9" cy="-3" rx="9" ry="4.5" fill="#4d948c" />
      <ellipse cx="9" cy="-3" rx="9" ry="4.5" fill="#4d948c" />
    </g>
  );
}

function Plant() {
  return (
    <g>
      {/* pot */}
      <polygon points="-9,2 9,2 6,16 -6,16" fill="#b5613b" />
      <ellipse cx="0" cy="2" rx="9" ry="3.5" fill="#cf7048" />
      {/* foliage */}
      <circle cx="0" cy="-12" r="11" fill="#2f8f4e" />
      <circle cx="-7" cy="-6" r="8" fill="#37a85b" />
      <circle cx="7" cy="-7" r="8" fill="#2b8047" />
      <circle cx="0" cy="-18" r="7" fill="#3cb863" />
    </g>
  );
}

function Cooler() {
  return (
    <g>
      {/* stand */}
      <polygon points="-8,4 8,4 6,22 -6,22" fill="#dfe6ee" />
      <polygon points="-8,4 -6,22 -6,22 -8,4" fill="#c4ccd6" />
      {/* bottle */}
      <rect x="-7" y="-14" width="14" height="18" rx="3" fill="#7fc7ff" opacity="0.85" />
      <rect x="-5" y="-12" width="10" height="14" rx="2" fill="#a8dbff" opacity="0.7" />
    </g>
  );
}

// Lighten/darken a hex colour by `amt` (-1..1).
function shade(hex: string, amt: number) {
  const m = hex.replace("#", "");
  const num = parseInt(m, 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  r = Math.max(0, Math.min(255, Math.round(r + r * amt)));
  g = Math.max(0, Math.min(255, Math.round(g + g * amt)));
  b = Math.max(0, Math.min(255, Math.round(b + b * amt)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
