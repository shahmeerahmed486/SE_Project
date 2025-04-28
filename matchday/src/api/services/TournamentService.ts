import { Tournament, TournamentStatus, UserRole, TournamentFormat } from '@/src/types';
import { store } from '../store/inMemoryStore';
import { AuthService } from './AuthService';

export interface TournamentInput {
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    registrationDeadline: string;
    location: string;
    format: TournamentFormat;
    teamLimit: number;
}

export class TournamentService {
    static async createTournament(data: TournamentInput, userId: string): Promise<Tournament> {
        await AuthService.validateUserRole(userId, [UserRole.ADMIN, UserRole.MANAGEMENT]);

        const tournament: Tournament = {
            id: crypto.randomUUID(),
            name: data.name,
            description: data.description,
            startDate: data.startDate,
            endDate: data.endDate,
            location: data.location,
            format: data.format,
            status: TournamentStatus.DRAFT,
            teamCount: 0,
            maxTeams: data.teamLimit,
            rules: [],
            registrationDeadline: data.registrationDeadline,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        return store.createTournament(tournament);
    }

    static async updateTournament(id: string, data: Partial<TournamentInput>, userId: string): Promise<Tournament> {
        await AuthService.validateUserRole(userId, [UserRole.ADMIN, UserRole.MANAGEMENT]);
        const updateData: Partial<Tournament> = {
            ...data,
            updatedAt: new Date().toISOString()
        };
        return store.updateTournament(id, updateData);
    }

    static async deleteTournament(id: string, userId: string): Promise<void> {
        await AuthService.validateUserRole(userId, [UserRole.ADMIN]);
        return store.deleteTournament(id);
    }
}

// const adminUser = {
//     email: "admin@matchday.com",
//     password: "secure_password",
//     role: UserRole.ADMIN,
//     name: "Admin User",
//     createdAt: new Date().toISOString(),
//     updatedAt: new Date().toISOString()
// }