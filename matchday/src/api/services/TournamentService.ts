import { Tournament, UserRole } from '@/types';
import { store } from '../store/inMemoryStore';
import { AuthService } from './AuthService';

export interface TournamentInput {
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    registrationDeadline: string;
    location: string;
    format: "LEAGUE" | "KNOCKOUT" | "GROUP_KNOCKOUT";
    teamLimit: number;
}

export class TournamentService {
    static async createTournament(data: TournamentInput, userId: string): Promise<Tournament> {
        await AuthService.validateUserRole(userId, [UserRole.ADMIN, UserRole.MANAGEMENT]);

        const tournament: Tournament = {
            id: crypto.randomUUID(),
            ...data,
            status: "DRAFT",
            teamCount: 0,
            managementTeam: [],
            createdBy: userId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        return store.createTournament(tournament);
    }

    static async updateTournament(id: string, data: Partial<TournamentInput>, userId: string): Promise<Tournament> {
        await AuthService.validateUserRole(userId, [UserRole.ADMIN, UserRole.MANAGEMENT]);
        const updateData = {
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

const adminUser = {
    email: "admin@matchday.com",
    password: "secure_password",
    role: UserRole.ADMIN,
    name: "Admin User",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
}