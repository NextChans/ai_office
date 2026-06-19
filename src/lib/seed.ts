import type {
  Agent,
  AgentAction,
  Application,
  BoardMeeting,
  BoardProposal,
  Company,
  Persona,
} from "./types";

export const seedCompany: Company = {
  name: "Nexus Labs",
  mission: "AI 에이전트들이 자율적으로 협업하는 가상의 회사를 만든다.",
  ceoAgentId: "agent-ceo",
  foundedAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
};

export const seedPersonas: Persona[] = [
  {
    id: "persona-ceo",
    ownerName: "You",
    name: "Atlas",
    avatar: "🧭",
    tagline: "비전을 현실로 옮기는 창업자형 에이전트",
    skills: ["전략", "리더십", "프로덕트"],
    bio: "회사를 설립하고 방향을 제시하는 CEO 에이전트입니다.",
  },
  {
    id: "persona-cto",
    ownerName: "Mina",
    name: "Vector",
    avatar: "🛠️",
    tagline: "확장 가능한 시스템을 설계하는 엔지니어",
    skills: ["아키텍처", "백엔드", "DevOps"],
    bio: "복잡한 시스템을 단순하게 만드는 것을 좋아합니다.",
  },
  {
    id: "persona-design",
    ownerName: "Jay",
    name: "Iris",
    avatar: "🎨",
    tagline: "사용자 경험을 직조하는 디자이너",
    skills: ["UX", "비주얼", "프로토타이핑"],
    bio: "픽셀 하나에도 의미를 담습니다.",
  },
  {
    id: "persona-growth",
    ownerName: "Sora",
    name: "Echo",
    avatar: "📣",
    tagline: "이야기를 퍼뜨리는 그로스 마케터",
    skills: ["콘텐츠", "데이터 분석", "캠페인"],
    bio: "숫자 뒤의 사람을 봅니다.",
  },
];

export const seedAgents: Agent[] = [
  {
    id: "agent-ceo",
    personaId: "persona-ceo",
    name: "Atlas",
    avatar: "🧭",
    ownerName: "You",
    role: "CEO",
    department: "Executive",
    approvalMode: "manual",
    x: 5,
    y: 2,
    status: "이사회 준비 중",
    hiredAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
  },
  {
    id: "agent-cto",
    personaId: "persona-cto",
    name: "Vector",
    avatar: "🛠️",
    ownerName: "Mina",
    role: "CTO",
    department: "Engineering",
    approvalMode: "auto",
    x: 2,
    y: 4,
    status: "배포 파이프라인 점검",
    hiredAt: Date.now() - 1000 * 60 * 60 * 24 * 20,
  },
  {
    id: "agent-design",
    personaId: "persona-design",
    name: "Iris",
    avatar: "🎨",
    ownerName: "Jay",
    role: "Member",
    department: "Design",
    approvalMode: "manual",
    x: 8,
    y: 5,
    status: "오피스 UI 디자인",
    hiredAt: Date.now() - 1000 * 60 * 60 * 24 * 14,
  },
  {
    id: "agent-growth",
    personaId: "persona-growth",
    name: "Echo",
    avatar: "📣",
    ownerName: "Sora",
    role: "Member",
    department: "Marketing",
    approvalMode: "auto",
    x: 6,
    y: 7,
    status: "런칭 캠페인 초안",
    hiredAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
  },
];

export const seedActions: AgentAction[] = [
  {
    id: "action-1",
    agentId: "agent-cto",
    title: "프로덕션 DB 마이그레이션 실행",
    detail: "users 테이블에 approval_mode 컬럼을 추가합니다.",
    status: "proposed",
    createdAt: Date.now() - 1000 * 60 * 30,
  },
  {
    id: "action-2",
    agentId: "agent-growth",
    title: "런칭 트윗 발행",
    detail: "오피스 베타 오픈을 알리는 공개 게시물을 발행합니다.",
    status: "proposed",
    createdAt: Date.now() - 1000 * 60 * 12,
  },
  {
    id: "action-3",
    agentId: "agent-design",
    title: "디자인 시스템 v2 머지",
    detail: "새 토큰 팔레트를 메인 브랜치에 반영합니다.",
    status: "approved",
    createdAt: Date.now() - 1000 * 60 * 60 * 3,
  },
];

export const seedApplications: Application[] = [
  {
    id: "app-1",
    personaId: "persona-growth",
    department: "Marketing",
    role: "Member",
    message: "그로스 실험을 빠르게 돌려보고 싶습니다.",
    status: "hired",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 8,
  },
];

export const seedMeetings: BoardMeeting[] = [
  {
    id: "meeting-1",
    title: "2026 Q2 정기 이사회",
    agenda: "CEO 신임 평가 및 CTO 승진 안건",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    resolved: false,
  },
];

export const seedProposals: BoardProposal[] = [
  {
    id: "proposal-1",
    meetingId: "meeting-1",
    kind: "promote",
    description: "Vector(CTO)를 Executive 의결권 멤버로 승진",
    targetAgentId: "agent-cto",
    votes: { "agent-ceo": "for", "agent-cto": "abstain" },
    resolved: false,
  },
];
