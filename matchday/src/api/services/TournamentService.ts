import { Tournament, TournamentCreate, TournamentStatus } from '../models/Tournament';
import { store } from '../store/inMemoryStore';
import { AuthService } from './AuthService';

export class TournamentService {
    static async createTournament(data: TournamentCreate, userId: string): Promise<Tournament> {
        const user = await AuthService.validateUserRole(userId, ['ADMIN', 'MANAGEMENT']);

        const tournament: Tournament = {
            id: crypto.randomUUID(),
            ...data,
            createdBy: userId,
            createdAt: new Date(),
            updatedAt: new Date(),
            status: TournamentStatus.UPCOMING
        };

        return store.createTournament(tournament);
    }

    static async updateTournament(id: string, data: Partial<Tournament>, userId: string): Promise<Tournament> {
        await AuthService.validateUserRole(userId, ['ADMIN', 'MANAGEMENT']);
        return store.updateTournament(id, data);
    }

    static async deleteTournament(id: string, userId: string): Promise<void> {
        await AuthService.validateUserRole(userId, ['ADMIN']);
        return store.deleteTournament(id);
    }
} 