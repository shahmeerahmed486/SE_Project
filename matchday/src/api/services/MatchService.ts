import { Match, UserRole } from '@/src/types'
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
            updatedAt: new Date().toISOString(),
            createdBy: userId,
            createdAt: new Date().toISOString()
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

    async updateMatchResult(matchId: string, scheduleId: string, scoreA: number, scoreB: number): Promise<void> {
        try {
            // Validate user role
            const user = await this.authService.getCurrentUser();
            if (!user || !['ADMIN', 'ORGANIZER'].includes(user.role)) {
                throw new Error('Unauthorized: Only admins and organizers can update match results');
            }

            // Validate inputs
            if (!matchId || !scheduleId) {
                throw new Error('Match ID and Schedule ID are required');
            }

            if (typeof scoreA !== 'number' || typeof scoreB !== 'number' || isNaN(scoreA) || isNaN(scoreB)) {
                throw new Error('Invalid scores provided');
            }

            // Get match to validate status
            const match = await this.getMatchById(matchId);
            if (!match) {
                throw new Error('Match not found');
            }

            if (match.status === 'COMPLETED') {
                throw new Error('Match is already completed');
            }

            // Update match result
            await updateMatchResult(matchId, scheduleId, scoreA, scoreB);

            // Update tournament status if needed
            const schedule = await this.getMatchScheduleById(scheduleId);
            if (schedule) {
                const tournament = await this.tournamentService.getTournamentById(schedule.tournamentId);
                if (tournament && tournament.status === 'UPCOMING') {
                    await this.tournamentService.updateTournamentStatus(schedule.tournamentId, 'ONGOING');
                }
            }
        } catch (error) {
            console.error('Error updating match result:', error);
            throw error;
        }
    }
} 