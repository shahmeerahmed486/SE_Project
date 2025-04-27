export enum UserRole {
    ADMIN = 'ADMIN',
    MANAGEMENT = 'MANAGEMENT',
    CAPTAIN = 'CAPTAIN',
    USER = 'USER'
}

// Base interface for all users
export interface BaseUser {
    id: string;
    email: string;
    username: string;
    name?: string;
    role: UserRole;
    password: string; // Note: Potentially redundant for client-side use, as Firebase Auth manages passwords server-side
    createdAt: Date; // Note: Using Date may cause mismatches with string-based timestamps in Firestore; consider string for consistency
    updatedAt: Date; // Note: Same as above
}

// Admin user type
export interface Admin extends BaseUser {
    role: UserRole.ADMIN;
}

// Management user type
export interface ManagementUser extends BaseUser {
    role: UserRole.MANAGEMENT;
    assignedTournaments: string[];
}

// Captain user type
export interface Captain extends BaseUser {
    role: UserRole.CAPTAIN;
    phone: string;
    teamId?: string;
}

// Union type for all user types
export type User = Admin | ManagementUser | Captain;

// Auth user for signup/login
export interface AuthUser {
    email: string;
    password: string;
    name: string;
    role?: UserRole;
    phone?: string;
}

// export interface Announcement {
//     id: string;
//     tournamentId: string;
//     title: string;
//     description: string;
//     content: string;
//     priority: 'low' | 'medium' | 'high';
//     timestamp: string;
//     createdBy: string;
//     createdAt: any; // Firestore Timestamp
//     updatedAt: string;
// }

export interface Announcement {
  id: string;
  title: string;
  message: string;
  tournamentId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export enum TournamentStatus {
    DRAFT = 'DRAFT',
    REGISTRATION_OPEN = 'REGISTRATION_OPEN',
    REGISTRATION_CLOSED = 'REGISTRATION_CLOSED',
    ONGOING = 'ONGOING',
    COMPLETED = 'COMPLETED'
}

export enum TournamentFormat {
    LEAGUE = 'LEAGUE',
    KNOCKOUT = 'KNOCKOUT',
    // GROUP_KNOCKOUT = 'GROUP_KNOCKOUT' // Added from @/types for stricter typing
}

export interface Tournament {
    id: string;
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    location: string;
    format: TournamentFormat; // Updated to use enum for type safety (was string)
    status: TournamentStatus;
    teamCount: number;
    maxTeams: number;
    rules: string[];
    registrationDeadline: string;
    createdAt: string;
    updatedAt: string;
}

export interface Team {
    id: string;
    name: string;
    tournamentId: string;
    captainId: string;
    players: {
        name: string;
        position: string;
        number: string;
    }[];
    eliminated: boolean; // Added from @/types for match scheduling
    createdAt: string;
    updatedAt: string;
    status: 'pending' | 'approved' | 'rejected' | 'eliminated'; // Added from @/types for team status
    // Note: The players structure is redundant with @/types's Player interface, which includes id and teamId
}

export interface Player {
    id: string;
    name: string;
    teamId: string;
    createdAt: string;
    updatedAt: string;
    // Added from @/types to support structured player data
}

// Legacy Match interface (retained to avoid breaking existing components)
// export interface LegacyMatch {
//     id: string;
//     tournamentId: string;
//     homeTeamId: string;
//     awayTeamId: string;
//     homeTeamScore?: number;
//     awayTeamScore?: number;
//     winner?: string; // Note: Redundant, as winner can be derived from scoreA/scoreB in Match
//     status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
//     round?: number; // Note: Redundant with Match's round: string
//     matchDate: string;
//     venue?: string; // Note: Redundant with Match's location
//     createdAt: string;
//     updatedAt: string;
//     // Note: This interface is redundant with the new Match interface below, which aligns with ManageMatchesPage
// }

// Updated Match interface (from @/types, adapted for ManageMatchesPage)
export interface Match {
    id: string;
    tournamentId: string;
    teamA: string; // Team ID
    teamB: string; // Team ID
    scoreA: number | null;
    scoreB: number | null;
    date: string;
    time: string;
    location: string;
    status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
    round?: string;
    createdBy: string; // Added for audit trail (used in ManageMatchesPage)
    createdAt: any; // Firestore Timestamp (used in ManageMatchesPage)
    updatedBy?: string; // Added for audit trail (used in ManageMatchesPage)
    updatedAt: string;
}

// Legacy MatchSchedule interface (retained to avoid breaking existing components)
// export interface LegacyMatchSchedule {
//     id: string;
//     tournamentId: string;
//     format: 'LEAGUE' | 'KNOCKOUT';
//     matches: Match[];
//     currentRound?: number;
//     createdAt: string;
//     updatedAt: string;
//     // Note: Redundant with MatchSchedule below, which uses matches: string[] for efficiency
// }

// Updated MatchSchedule interface (from @/types)
export interface MatchSchedule {
    id: string;
    tournamentId: string;
    matches: string[]; // Array of match IDs
    createdAt: string;
    updatedAt: string;
}

export interface PointsTableEntry {
    teamId: string;
    teamName: string;
    matchesPlayed: number;
    wins: number;
    losses: number;
    draws: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    points: number;
}

export interface PointsTable {
    id: string;
    tournamentId: string;
    entries: PointsTableEntry[];
    lastUpdated: string;
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
    // Added from @/types for tournament standings
}

export interface TournamentRules {
    id: string;
    tournamentId: string;
    rulesText: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    // Added from @/types for structured rule management
}