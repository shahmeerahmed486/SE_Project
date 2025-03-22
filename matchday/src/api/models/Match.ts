export enum MatchStatus {
    SCHEDULED = 'SCHEDULED',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED'
}

export interface Match {
    id: string;
    tournamentId: string;
    teamAId: string;
    teamBId: string;
    scoreA: number | null;
    scoreB: number | null;
    date: Date;
    location: string;
    status: MatchStatus;
    round: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface MatchCreate {
    tournamentId: string;
    teamAId: string;
    teamBId: string;
    date: Date;
    location: string;
    round: string;
} 