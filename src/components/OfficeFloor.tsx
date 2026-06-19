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

// ── Per-company office themes (atmosphere) ──────────────────────────────────
interface Theme {
  name: string;
  wallL: string;
  wallR: string;
  floorA: string;
  floorB: string;
  carpet: Partial<Record<Department, string>>;
}

const THEMES: Theme[] = [
  {
    name: "사이버 스튜디오",
    wallL: "#2c2a3f", wallR: "#232133", floorA: "#262433", floorB: "#201e2b",
    carpet: { Executive: "#3a3566", Engineering: "#1f4a45", Design: "#4d3a1c", Marketing: "#4d2630" },
  },
  {
    name: "코지 우드",
    wallL: "#3a3026", wallR: "#2e261d", floorA: "#3a2f24", floorB: "#332921",
    carpet: { Executive: "#4a3d6a", Engineering: "#3a5a3a", Design: "#6b4f2a", Marketing: "#6b3a3a" },
  },
  {
    name: "그린 캠퍼스",
    wallL: "#243a2c", wallR: "#1d3024", floorA: "#26332a", floorB: "#202b23",
    carpet: { Executive: "#2f5a4a", Engineering: "#2f6b3a", Design: "#5a6b2a", Marketing: "#6b5a2a" },
  },
  {
    name: "미드나잇",
    wallL: "#1f2440", wallR: "#181c33", floorA: "#1e2233", floorB: "#191d2b",
    carpet: { Executive: "#2a3a6a", Engineering: "#1f4a55", Design: "#3a3a5a", Marketing: "#4a2a5a" },
  },
  {
    name: "선셋 로프트",
    wallL: "#3a2a32", wallR: "#2e2028", floorA: "#33262b", floorB: "#2b2024",
    carpet: { Executive: "#5a3a4a", Engineering: "#3a5a55", Design: "#6b5030", Marketing: "#7a3a44" },
  },
];

// Deterministic RNG seeded from the company id (stable per company).
function hashSeed(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Generate a stable-but-varied office layout (theme + furniture) per company. */
function generateOffice(seedStr: string): { theme: Theme; furniture: Furniture[] } {
  const rng = mulberry32(hashSeed(seedStr || "default"));
  const theme = THEMES[Math.floor(rng() * THEMES.length)];
  const occupied = new Set<string>();
  const furniture: Furniture[] = [];
  const key = (x: number, y: number) => `${x},${y}`;
  const inGrid = (x: number, y: number) => x >= 0 && x < GRID_W && y >= 0 && y < GRID_H;

  const zoneTiles = (z: Zone) => {
    const t: { x: number; y: number }[] = [];
    for (let y = z.y[0]; y <= z.y[1]; y++)
      for (let x = z.x[0]; x <= z.x[1]; x++) if (inGrid(x, y)) t.push({ x, y });
    return t;
  };
  const shuffle = <T,>(arr: T[]) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // Executive: a meeting table on a random exec tile.
  const exec = ZONES.find((z) => z.dept === "Executive");
  if (exec) {
    const t = shuffle(zoneTiles(exec))[0];
    if (t) {
      furniture.push({ type: "meeting", x: t.x, y: t.y });
      occupied.add(key(t.x, t.y));
    }
  }

  // Each non-exec department: a random number of desks.
  for (const z of ZONES) {
    if (z.dept === "Executive") continue;
    const tiles = shuffle(zoneTiles(z)).filter((t) => !occupied.has(key(t.x, t.y)));
    const count = 1 + Math.floor(rng() * Math.min(tiles.length, 4)); // 1..4
    for (let i = 0; i < count && i < tiles.length; i++) {
      const t = tiles[i];
      furniture.push({ type: "desk", x: t.x, y: t.y, tint: z.shirt });
      occupied.add(key(t.x, t.y));
    }
  }

  // Decor scattered on remaining free tiles.
  const free: { x: number; y: number }[] = [];
  for (let y = 0; y < GRID_H; y++)
    for (let x = 0; x < GRID_W; x++) if (!occupied.has(key(x, y))) free.push({ x, y });
  shuffle(free);
  let i = 0;
  const plants = 2 + Math.floor(rng() * 4); // 2..5
  for (let p = 0; p < plants && i < free.length; p++, i++) {
    const t = free[i];
    furniture.push({ type: "plant", x: t.x, y: t.y });
  }
  if (rng() < 0.75 && i < free.length) {
    furniture.push({ type: "sofa", x: free[i].x, y: free[i].y });
    i++;
  }
  if (rng() < 0.75 && i < free.length) {
    furniture.push({ type: "cooler", x: free[i].x, y: free[i].y });
    i++;
  }

  return { theme, furniture };
}

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

  // Per-company office atmosphere & furniture (stable per company id).
  const { theme, furniture } = useMemo(() => generateOffice(scopeId), [scopeId]);

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

  // Scale the fixed-size board to fit narrow viewports (mobile) — no scroll.
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const update = () => {
      const avail = el.clientWidth - 24; // account for padding
      setScale(Math.min(1, Math.max(0.4, avail / BOARD_W)));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
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
    <div
      ref={frameRef}
      className="pixel-panel relative overflow-hidden bg-[#13111a] p-3 md:p-6"
    >
      <div
        className="relative mx-auto"
        style={{ width: BOARD_W * scale, height: BOARD_H * scale }}
      >
        <div
          className="relative"
          style={{
            width: BOARD_W,
            height: BOARD_H,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
        {/* ---- Static room: walls, floor, furniture (one SVG) ---- */}
        <svg
          width={BOARD_W}
          height={BOARD_H}
          viewBox={`0 0 ${BOARD_W} ${BOARD_H}`}
          className="absolute left-0 top-0"
          shapeRendering="crispEdges"
        >
          {/* Left wall */}
          <polygon
            points={`${backCorner.x},${backCorner.y} ${leftCorner.x},${leftCorner.y} ${leftCorner.x},${leftCorner.y - WALL_H} ${backCorner.x},${backCorner.y - WALL_H}`}
            fill={theme.wallL}
            stroke="rgba(0,0,0,0.4)"
          />
          {/* Right wall */}
          <polygon
            points={`${backCorner.x},${backCorner.y} ${rightCorner.x},${rightCorner.y} ${rightCorner.x},${rightCorner.y - WALL_H} ${backCorner.x},${backCorner.y - WALL_H}`}
            fill={theme.wallR}
            stroke="rgba(0,0,0,0.4)"
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

          {/* Floor tiles — each rendered as a beveled block (base + lighter top) */}
          {tiles.map(({ x, y }) => {
            const zone = zoneFor(x, y);
            const base = zone
              ? theme.carpet[zone.dept] ?? theme.floorA
              : (x + y) % 2 === 0
                ? theme.floorA
                : theme.floorB;
            const top = shade(base, 0.22);
            const ccx = cx(x, y);
            const ccy = cy(x, y);
            const iw = H * 0.82;
            const ih = Q * 0.82;
            return (
              <g key={`${x}-${y}`}>
                <polygon
                  points={`${ccx},${ccy - Q} ${ccx + H},${ccy} ${ccx},${ccy + Q} ${ccx - H},${ccy}`}
                  fill={shade(base, -0.25)}
                  stroke="rgba(0,0,0,0.35)"
                />
                <polygon
                  points={`${ccx},${ccy - ih} ${ccx + iw},${ccy} ${ccx},${ccy + ih} ${ccx - iw},${ccy}`}
                  fill={top}
                />
              </g>
            );
          })}

          {/* Furniture (painter's order: back to front) */}
          {[...furniture]
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
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 border-2 border-ink bg-black/70 px-2 py-0.5 text-[10px] font-medium text-white/80"
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
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-muted">
        <span className="border-2 border-ink bg-panel-2 px-2 py-0.5 text-text">
          🎨 {theme.name}
        </span>
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
// All furniture is drawn with rects/polygons only (no curves) so it stays
// crisp and blocky under shape-rendering: crispEdges.
function BlockChair({ x = 0, y = 0 }: { x?: number; y?: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      {/* seat (iso top) */}
      <polygon points="0,-6 10,0 0,6 -10,0" fill="#46485f" />
      <polygon points="-10,0 0,6 0,12 -10,6" fill="#2c2d40" />
      <polygon points="10,0 0,6 0,12 10,6" fill="#37384d" />
      {/* backrest block */}
      <rect x="-4" y="-18" width="8" height="13" fill="#46485f" />
      <rect x="-4" y="-18" width="8" height="3" fill="#5a5c75" />
    </g>
  );
}

function Desk({ tint }: { tint: string }) {
  const top = "#7a5f3c";
  const left = "#4c3a25";
  const right = "#5a4530";
  return (
    <g>
      <BlockChair y={-26} />
      {/* desk top (iso slab) */}
      <polygon points="0,-24 28,-10 0,4 -28,-10" fill={top} />
      <polygon points="-28,-10 0,4 0,16 -28,2" fill={left} />
      <polygon points="28,-10 0,4 0,16 28,2" fill={right} />
      {/* monitor (block) */}
      <rect x="-13" y="-30" width="16" height="12" fill="#15151f" />
      <rect x="-11" y="-28" width="12" height="8" fill={tint} />
      <rect x="-3" y="-18" width="2" height="4" fill="#15151f" />
      {/* keyboard + cup (pixels) */}
      <rect x="4" y="-13" width="10" height="4" fill="#2a2a38" />
      <rect x="16" y="-15" width="5" height="6" fill="#e8c9a0" />
    </g>
  );
}

function MeetingTable() {
  return (
    <g>
      {/* slab */}
      <polygon points="0,-18 40,-2 0,14 -40,-2" fill="#7a5f3c" />
      <polygon points="-40,-2 0,14 0,22 -40,6" fill="#4c3a25" />
      <polygon points="40,-2 0,14 0,22 40,6" fill="#5a4530" />
      {/* chairs around */}
      {([[-40, -2], [40, -2], [-22, -16], [22, -16], [-22, 10], [22, 10]] as [number, number][]).map(
        ([dx, dy], i) => (
          <BlockChair key={i} x={dx} y={dy} />
        )
      )}
    </g>
  );
}

function Sofa() {
  return (
    <g>
      {/* base block */}
      <polygon points="0,-14 30,1 0,16 -30,1" fill="#3f7a72" />
      <polygon points="-30,1 0,16 0,24 -30,9" fill="#2c554f" />
      <polygon points="30,1 0,16 0,24 30,9" fill="#346159" />
      {/* back block */}
      <polygon points="-30,1 0,-14 0,-28 -30,-13" fill="#4d948c" />
      {/* seat cushions (blocks) */}
      <rect x="-18" y="-6" width="14" height="7" fill="#56a59c" />
      <rect x="4" y="-6" width="14" height="7" fill="#56a59c" />
    </g>
  );
}

function Plant() {
  return (
    <g>
      {/* pot block */}
      <polygon points="-9,2 9,2 6,16 -6,16" fill="#b5613b" />
      <polygon points="-9,2 -6,16 6,16 9,2" fill="#a0542f" opacity="0.4" />
      <rect x="-9" y="0" width="18" height="3" fill="#cf7048" />
      {/* blocky foliage (stacked squares) */}
      <rect x="-10" y="-10" width="20" height="12" fill="#2f8f4e" />
      <rect x="-7" y="-18" width="14" height="10" fill="#37a85b" />
      <rect x="-4" y="-24" width="8" height="8" fill="#3cb863" />
      <rect x="-10" y="-10" width="20" height="2" fill="#3cb863" opacity="0.5" />
    </g>
  );
}

function Cooler() {
  return (
    <g>
      {/* stand block */}
      <rect x="-8" y="4" width="16" height="18" fill="#cdd5df" />
      <rect x="-8" y="4" width="4" height="18" fill="#aab3bf" />
      {/* bottle block */}
      <rect x="-7" y="-14" width="14" height="18" fill="#7fc7ff" />
      <rect x="-7" y="-14" width="4" height="18" fill="#a8dbff" />
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
