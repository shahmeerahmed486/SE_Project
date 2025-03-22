export enum AnnouncementType {
    GENERAL = 'GENERAL',
    MATCH_UPDATE = 'MATCH_UPDATE',
    TOURNAMENT_UPDATE = 'TOURNAMENT_UPDATE',
    TEAM_UPDATE = 'TEAM_UPDATE'
}

export interface Announcement {
    id: string;
    title: string;
    content: string;
    type: AnnouncementType;
    tournamentId?: string;
    matchId?: string;
    createdBy: string;
    createdAt: Date;
}

export interface AnnouncementCreate {
    title: string;
    content: string;
    type: AnnouncementType;
    tournamentId?: string;
    matchId?: string;
} 