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
    password: string;
    createdAt: Date;
    updatedAt: Date;
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

export interface Announcement {
    id: string;
    tournamentId: string;
    title: string;
    description: string;
    content: string;
    priority: 'low' | 'medium' | 'high';
    timestamp: string;
    createdBy: string;
    createdAt: any; // Firestore Timestamp
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
    KNOCKOUT = 'KNOCKOUT'
}


export interface Tournament {
    id: string;
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    location: string;
    format: string;
    status: TournamentStatus;
    teamCount: number;
    maxTeams: number;
    rules: string[];
    prizes: string[];
    registrationStatus: string;
    registrationDeadline?: string;
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
    createdAt: string;
    updatedAt: string;
}

export interface Match {
    id: string;
    tournamentId: string;
    homeTeamId: string;
    awayTeamId: string;
    homeTeamScore?: number;
    awayTeamScore?: number;
    winner?: string;  // team ID of winner
    status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    round?: number;   // For knockout tournaments
    matchDate: string;
    venue?: string;
    createdAt: string;
    updatedAt: string;
}

export interface MatchSchedule {
    id: string;
    tournamentId: string;
    format: 'LEAGUE' | 'KNOCKOUT';
    matches: Match[];
    currentRound?: number;  // For knockout tournaments
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