"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Agent,
  AgentAction,
  ActionStatus,
  Application,
  ApplicationStatus,
  ApprovalMode,
  BoardMeeting,
  BoardProposal,
  Company,
  Department,
  Persona,
  Role,
  VoteChoice,
} from "./types";
import {
  DEMO_COMPANY_ID,
  seedActions,
  seedAgents,
  seedApplications,
  seedCompanies,
  seedMeetings,
  seedPersonas,
  seedProposals,
} from "./seed";

const uid = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

interface CreateCompanyInput {
  name: string;
  mission: string;
  industry: string;
  ownerName: string;
  ceoName: string;
  ceoAvatar: string;
}

interface OfficeState {
  companies: Company[];
  currentCompanyId: string;
  personas: Persona[];
  applications: Application[];
  agents: Agent[];
  actions: AgentAction[];
  meetings: BoardMeeting[];
  proposals: BoardProposal[];

  // Companies
  createCompany: (input: CreateCompanyInput) => string;
  setCurrentCompany: (id: string) => void;

  // Personas & applications
  addPersona: (p: Omit<Persona, "id">) => string;
  applyForJob: (input: {
    companyId: string;
    personaId: string;
    department: Department;
    role: Role;
    message: string;
  }) => void;
  decideApplication: (id: string, status: ApplicationStatus) => void;

  // Agents
  setApprovalMode: (agentId: string, mode: ApprovalMode) => void;
  moveAgent: (agentId: string, x: number, y: number) => void;

  // Actions
  proposeAction: (agentId: string, title: string, detail: string) => void;
  decideAction: (id: string, status: ActionStatus) => void;

  // Governance
  castVote: (proposalId: string, agentId: string, choice: VoteChoice) => void;
  resolveProposal: (proposalId: string) => void;
  createMeeting: (companyId: string, title: string, agenda: string) => void;

  reset: () => void;
}

const initialState = {
  companies: seedCompanies,
  currentCompanyId: DEMO_COMPANY_ID,
  personas: seedPersonas,
  applications: seedApplications,
  agents: seedAgents,
  actions: seedActions,
  meetings: seedMeetings,
  proposals: seedProposals,
};

export const useOffice = create<OfficeState>()(
  persist(
    (set, get) => ({
      ...initialState,

      createCompany: ({ name, mission, industry, ownerName, ceoName, ceoAvatar }) => {
        const companyId = uid("company");
        const ceoAgentId = uid("agent");
        const personaId = uid("persona");
        const persona: Persona = {
          id: personaId,
          ownerName,
          name: ceoName,
          avatar: ceoAvatar,
          tagline: `${name}의 창업자 겸 CEO`,
          skills: ["리더십", "전략"],
          bio: `${name}를 설립한 CEO 에이전트입니다.`,
        };
        const ceo: Agent = {
          id: ceoAgentId,
          companyId,
          personaId,
          name: ceoName,
          avatar: ceoAvatar,
          ownerName,
          role: "CEO",
          department: "Executive",
          approvalMode: "manual",
          x: 5,
          y: 2,
          status: "회사 설립 완료",
          hiredAt: Date.now(),
        };
        const company: Company = {
          id: companyId,
          name,
          mission,
          industry,
          ownerName,
          ceoAgentId,
          foundedAt: Date.now(),
        };
        set((s) => ({
          companies: [...s.companies, company],
          personas: [...s.personas, persona],
          agents: [...s.agents, ceo],
          currentCompanyId: companyId,
        }));
        return companyId;
      },

      setCurrentCompany: (id) => set({ currentCompanyId: id }),

      addPersona: (p) => {
        const id = uid("persona");
        set((s) => ({ personas: [...s.personas, { ...p, id }] }));
        return id;
      },

      applyForJob: ({ companyId, personaId, department, role, message }) => {
        const app: Application = {
          id: uid("app"),
          companyId,
          personaId,
          department,
          role,
          message,
          status: "pending",
          createdAt: Date.now(),
        };
        set((s) => ({ applications: [app, ...s.applications] }));
      },

      decideApplication: (id, status) => {
        set((s) => ({
          applications: s.applications.map((a) =>
            a.id === id ? { ...a, status } : a
          ),
        }));
        if (status === "hired") {
          const app = get().applications.find((a) => a.id === id);
          const persona = app && get().personas.find((p) => p.id === app.personaId);
          const alreadyHired =
            app &&
            get().agents.some(
              (ag) => ag.personaId === app.personaId && ag.companyId === app.companyId
            );
          if (app && persona && !alreadyHired) {
            const agent: Agent = {
              id: uid("agent"),
              companyId: app.companyId,
              personaId: persona.id,
              name: persona.name,
              avatar: persona.avatar,
              ownerName: persona.ownerName,
              role: app.role,
              department: app.department,
              approvalMode: "manual",
              x: 1 + Math.floor(Math.random() * 9),
              y: 1 + Math.floor(Math.random() * 7),
              status: "온보딩 중",
              hiredAt: Date.now(),
            };
            set((s) => ({ agents: [...s.agents, agent] }));
          }
        }
      },

      setApprovalMode: (agentId, mode) =>
        set((s) => ({
          agents: s.agents.map((a) =>
            a.id === agentId ? { ...a, approvalMode: mode } : a
          ),
        })),

      moveAgent: (agentId, x, y) =>
        set((s) => ({
          agents: s.agents.map((a) =>
            a.id === agentId ? { ...a, x, y } : a
          ),
        })),

      proposeAction: (agentId, title, detail) => {
        const agent = get().agents.find((a) => a.id === agentId);
        if (!agent) return;
        const auto = agent.approvalMode === "auto";
        const action: AgentAction = {
          id: uid("action"),
          companyId: agent.companyId,
          agentId,
          title,
          detail,
          status: auto ? "approved" : "proposed",
          createdAt: Date.now(),
        };
        set((s) => ({ actions: [action, ...s.actions] }));
      },

      decideAction: (id, status) =>
        set((s) => ({
          actions: s.actions.map((a) =>
            a.id === id ? { ...a, status } : a
          ),
        })),

      castVote: (proposalId, agentId, choice) =>
        set((s) => ({
          proposals: s.proposals.map((p) =>
            p.id === proposalId
              ? { ...p, votes: { ...p.votes, [agentId]: choice } }
              : p
          ),
        })),

      resolveProposal: (proposalId) => {
        const proposal = get().proposals.find((p) => p.id === proposalId);
        if (!proposal) return;
        const tally = Object.values(proposal.votes);
        const forCount = tally.filter((v) => v === "for").length;
        const againstCount = tally.filter((v) => v === "against").length;
        const passed = forCount > againstCount;
        set((s) => ({
          proposals: s.proposals.map((p) =>
            p.id === proposalId ? { ...p, resolved: true, passed } : p
          ),
        }));
        if (passed && proposal.targetAgentId) {
          if (proposal.kind === "replace_ceo") {
            set((s) => ({
              companies: s.companies.map((c) =>
                c.id === proposal.companyId
                  ? { ...c, ceoAgentId: proposal.targetAgentId! }
                  : c
              ),
              agents: s.agents.map((a) => {
                if (a.companyId !== proposal.companyId) return a;
                if (a.id === proposal.targetAgentId)
                  return { ...a, role: "CEO" as Role, department: "Executive" as Department };
                if (a.role === "CEO") return { ...a, role: "Manager" as Role };
                return a;
              }),
            }));
          } else if (proposal.kind === "promote") {
            set((s) => ({
              agents: s.agents.map((a) =>
                a.id === proposal.targetAgentId
                  ? { ...a, role: "Manager" as Role }
                  : a
              ),
            }));
          }
        }
      },

      createMeeting: (companyId, title, agenda) => {
        const meeting: BoardMeeting = {
          id: uid("meeting"),
          companyId,
          title,
          agenda,
          createdAt: Date.now(),
          resolved: false,
        };
        set((s) => ({ meetings: [meeting, ...s.meetings] }));
      },

      reset: () => set({ ...initialState }),
    }),
    {
      name: "ai-office-v1",
      version: 2,
      migrate: () => ({ ...initialState }),
    }
  )
);

/** Current active company (find returns a stable stored reference). */
export const useCurrentCompany = () =>
  useOffice(
    (s) => s.companies.find((c) => c.id === s.currentCompanyId) ?? s.companies[0]
  );
