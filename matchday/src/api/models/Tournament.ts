export enum TournamentFormat {
    KNOCKOUT = 'KNOCKOUT',
    LEAGUE = 'LEAGUE',
    GROUP = 'GROUP'
}

export enum TournamentStatus {
    UPCOMING = 'UPCOMING',
    ACTIVE = 'ACTIVE',
    COMPLETED = 'COMPLETED'
}

export interface Tournament {
    id: string;
    name: string;
    description: string;
    format: TournamentFormat;
    status: TournamentStatus;
    startDate: Date;
    endDate: Date;
    maxTeams: number;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
} 