export enum UserRole {
  ADMIN = "ADMIN",
  MANAGEMENT = "MANAGEMENT",
  CAPTAIN = "CAPTAIN"
}

export interface BaseUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Admin extends BaseUser {
  role: UserRole.ADMIN;
}

export interface ManagementTeam extends BaseUser {
  role: UserRole.MANAGEMENT;
  assignedTournaments: string[];
}

export interface Captain extends BaseUser {
  role: UserRole.CAPTAIN;
  teamId?: string;
}

export type User = Admin | ManagementTeam | Captain;

export interface AuthUser {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

export interface Tournament {
  id: string;
  name: string;
  format: "LEAGUE" | "KNOCKOUT" | "GROUP_KNOCKOUT";
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  teamLimit: number;
  status: "DRAFT" | "REGISTRATION" | "IN_PROGRESS" | "COMPLETED";
  teamCount: number;
  managementTeam: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  rules?: string[]; // Array of tournament rules
}

export interface Team {
  id: string;
  name: string;
  eliminated: boolean;
  captainId: string;
  players: Player[];
  tournamentIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Player {
  id: string;
  name: string;
  teamId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Match {
  id: string;
  tournamentId: string;
  teamA: string;
  teamB: string;
  date: string;
  time: string;
  location: string;
  round?: string;
  scoreA: number | null;
  scoreB: number | null;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED";
  updatedAt: string;
}

export interface MatchSchedule {
  id: string;
  tournamentId: string;
  matches: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Standings {
  id: string;
  tournamentId: string;
  rankings: {
    teamId: string;
    rank: number;
    points: number;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
  }[];
  updatedAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  tournamentId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TournamentRules {
  id: string;
  tournamentId: string;
  rulesText: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}