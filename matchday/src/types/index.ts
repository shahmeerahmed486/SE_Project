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