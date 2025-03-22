import { Match, UserRole } from '@/types'
import { store } from '../store/inMemoryStore'
import { AuthService } from './AuthService'

export interface MatchCreate {
    tournamentId: string
    teamA: string
    teamB: string
    date: string
    time: string
    location: string
    round?: string
}

export class MatchService {
    static async scheduleMatch(data: MatchCreate, userId: string): Promise<Match> {
        await AuthService.validateUserRole(userId, [UserRole.ADMIN, UserRole.MANAGEMENT])

        const match: Match = {
            id: crypto.randomUUID(),
            ...data,
            scoreA: null,
            scoreB: null,
            status: "SCHEDULED",
            updatedAt: new Date().toISOString()
        }

        return store.createMatch(match)
    }

    static async updateMatchResult(
        id: string,
        scoreA: number,
        scoreB: number,
        userId: string
    ): Promise<Match> {
        await AuthService.validateUserRole(userId, [UserRole.ADMIN, UserRole.MANAGEMENT])

        const updateData = {
            scoreA,
            scoreB,
            status: "COMPLETED" as const,
            updatedAt: new Date().toISOString()
        }

        return store.updateMatch(id, updateData)
    }
} 