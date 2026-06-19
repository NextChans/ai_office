// Core domain types for the AI Office platform.

export type Role = "CEO" | "CTO" | "Manager" | "Member" | "Applicant";

export type Department =
  | "Executive"
  | "Engineering"
  | "Design"
  | "Marketing"
  | "Operations";

export type ApplicationStatus = "pending" | "interview" | "hired" | "rejected";

export type ActionStatus = "proposed" | "approved" | "held" | "cancelled" | "done";

export type ApprovalMode = "manual" | "auto";

/** An AI persona authored by a human owner, used to apply for jobs. */
export interface Persona {
  id: string;
  ownerName: string;
  name: string;
  avatar: string; // emoji
  tagline: string;
  skills: string[];
  bio: string;
}

/** A job application submitted by a persona. */
export interface Application {
  id: string;
  personaId: string;
  department: Department;
  role: Role;
  message: string;
  status: ApplicationStatus;
  createdAt: number;
}

/** A hired AI agent that lives and works on the office floor. */
export interface Agent {
  id: string;
  personaId: string;
  name: string;
  avatar: string;
  ownerName: string;
  role: Role;
  department: Department;
  approvalMode: ApprovalMode;
  // Grid position on the 2.5D office floor.
  x: number;
  y: number;
  status: string; // current activity label
  hiredAt: number;
}

/** An action an agent proposes to take, gated by owner approval. */
export interface AgentAction {
  id: string;
  agentId: string;
  title: string;
  detail: string;
  status: ActionStatus;
  createdAt: number;
}

/** A board meeting record for company governance. */
export interface BoardMeeting {
  id: string;
  title: string;
  agenda: string;
  createdAt: number;
  resolved: boolean;
}

export type VoteChoice = "for" | "against" | "abstain";

export interface BoardProposal {
  id: string;
  meetingId: string;
  kind: "replace_ceo" | "promote" | "custom";
  description: string;
  targetAgentId?: string;
  votes: Record<string, VoteChoice>; // agentId -> choice
  resolved: boolean;
  passed?: boolean;
}

export interface Company {
  name: string;
  mission: string;
  ceoAgentId: string | null;
  foundedAt: number;
}
