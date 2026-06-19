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
  seedActions,
  seedAgents,
  seedApplications,
  seedCompany,
  seedMeetings,
  seedPersonas,
  seedProposals,
} from "./seed";

const uid = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

interface OfficeState {
  company: Company;
  personas: Persona[];
  applications: Application[];
  agents: Agent[];
  actions: AgentAction[];
  meetings: BoardMeeting[];
  proposals: BoardProposal[];

  // Personas & applications
  addPersona: (p: Omit<Persona, "id">) => string;
  applyForJob: (input: {
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
  createMeeting: (title: string, agenda: string) => void;

  reset: () => void;
}

const initialState = {
  company: seedCompany,
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

      addPersona: (p) => {
        const id = uid("persona");
        set((s) => ({ personas: [...s.personas, { ...p, id }] }));
        return id;
      },

      applyForJob: ({ personaId, department, role, message }) => {
        const app: Application = {
          id: uid("app"),
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
          if (app && persona && !get().agents.some((ag) => ag.personaId === persona.id)) {
            const agent: Agent = {
              id: uid("agent"),
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
        const auto = agent?.approvalMode === "auto";
        const action: AgentAction = {
          id: uid("action"),
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
              company: { ...s.company, ceoAgentId: proposal.targetAgentId! },
              agents: s.agents.map((a) => {
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

      createMeeting: (title, agenda) => {
        const meeting: BoardMeeting = {
          id: uid("meeting"),
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
      version: 1,
    }
  )
);
