export enum UserRole {
  ADMIN = "ADMIN",
  MANAGEMENT = "MANAGEMENT",
  USER = "USER"
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tournamentIds?: string[]; // Tournament IDs for management team
  createdAt: string;
  updatedAt: string;
}

export interface Tournament {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  format: "LEAGUE" | "KNOCKOUT" | "GROUP_KNOCKOUT";
  status: "DRAFT" | "PUBLISHED" | "IN_PROGRESS" | "COMPLETED";
  teamCount: number;
  maxTeams: number;
  managementTeam?: string[]; // User IDs of management team members
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  captainId: string;
  members: string[];
  tournamentIds: string[];
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
}

export interface Player {
  name: string
  email?: string
  position?: string
  number?: number
}

export interface Match {
  id: string
  tournamentId: string
  teamA: string
  teamB: string
  scoreA: number | null
  scoreB: number | null
  date: string
  time: string
  location: string
  status: "scheduled" | "in_progress" | "completed" | "cancelled"
  round?: string
  updatedBy?: string
  updatedAt?: Date
}

export interface Announcement {
  id: string
  tournamentId: string
  title: string
  content: string
  createdAt: Date
  createdBy: string
  priority: "low" | "medium" | "high"
}