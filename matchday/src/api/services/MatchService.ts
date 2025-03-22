import { Match, MatchCreate, MatchStatus } from '../models/Match';
import { store } from '../store/inMemoryStore';
import { AuthService } from './AuthService';

export class MatchService {
    static async scheduleMatch(data: MatchCreate, userId: string): Promise<Match> {
        await AuthService.validateUserRole(userId, ['ADMIN', 'MANAGEMENT']);

        const match: Match = {
            id: crypto.randomUUID(),
            ...data,
            scoreA: null,
            scoreB: null,
            status: MatchStatus.SCHEDULED,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        return store.createMatch(match);
    }

    static async updateMatchResult(
        id: string,
        scoreA: number,
        scoreB: number,
        userId: string
    ): Promise<Match> {
        await AuthService.validateUserRole(userId, ['ADMIN', 'MANAGEMENT']);
        return store.updateMatchResult(id, scoreA, scoreB);
    }
} 