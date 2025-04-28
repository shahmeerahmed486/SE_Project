import { MatchService } from '@/src/api/services/MatchService';
import { AuthService } from '@/src/api/services/AuthService';
import { store } from '@/src/api/store/inMemoryStore';
import { Match, UserRole } from '@/src/types';

jest.mock('@/src/api/services/AuthService');
jest.mock('@/src/api/store/inMemoryStore');

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
    value: {
        randomUUID: () => 'mock-uuid'
    }
});

// Mock Date.now() to return a fixed timestamp
const mockTimestamp = '2025-04-28T20:04:17.837Z';
jest.spyOn(Date.prototype, 'toISOString').mockReturnValue(mockTimestamp);

describe('MatchService', () => {
    const mockMatch: Omit<Match, 'id'> = {
        tournamentId: 't1',
        teamA: 'Team A',
        teamB: 'Team B',
        date: '2024-01-01',
        time: '14:00',
        location: 'Stadium 1',
        round: 'Round 1',
        status: 'SCHEDULED',
        scoreA: null,
        scoreB: null,
        createdBy: 'user1',
        createdAt: mockTimestamp,
        updatedAt: mockTimestamp
    };

    const mockUserId = 'user1';

    beforeEach(() => {
        jest.clearAllMocks();
        (AuthService.validateUserRole as jest.Mock).mockResolvedValue({ id: mockUserId, role: UserRole.ADMIN });
    });

    describe('scheduleMatch', () => {
        it('should schedule a match successfully', async () => {
            const mockCreatedMatch = { id: 'm1', ...mockMatch };
            (store.createMatch as jest.Mock).mockResolvedValue(mockCreatedMatch);

            const result = await MatchService.scheduleMatch(mockMatch, mockUserId);

            expect(AuthService.validateUserRole).toHaveBeenCalledWith(mockUserId, [UserRole.ADMIN, UserRole.MANAGEMENT]);
            expect(store.createMatch).toHaveBeenCalledWith(expect.objectContaining({
                ...mockMatch,
                id: expect.any(String)
            }));
            expect(result).toEqual(mockCreatedMatch);
        });

        it('should throw error for unauthorized user', async () => {
            (AuthService.validateUserRole as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

            await expect(MatchService.scheduleMatch(mockMatch, mockUserId))
                .rejects.toThrow('Unauthorized');
        });
    });

    describe('updateMatchResult', () => {
        it('should update match result successfully', async () => {
            const matchId = 'm1';
            const scoreA = 2;
            const scoreB = 1;
            const mockUpdatedMatch = { id: matchId, ...mockMatch, scoreA, scoreB, status: 'COMPLETED' };
            (store.updateMatch as jest.Mock).mockResolvedValue(mockUpdatedMatch);

            const result = await MatchService.updateMatchResult(matchId, scoreA, scoreB, mockUserId);

            expect(AuthService.validateUserRole).toHaveBeenCalledWith(mockUserId, [UserRole.ADMIN, UserRole.MANAGEMENT]);
            expect(store.updateMatch).toHaveBeenCalledWith(matchId, expect.objectContaining({
                scoreA,
                scoreB,
                status: 'COMPLETED',
                updatedAt: expect.any(String)
            }));
            expect(result).toEqual(mockUpdatedMatch);
        });

        it('should throw error for unauthorized user', async () => {
            (AuthService.validateUserRole as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

            await expect(MatchService.updateMatchResult('m1', 2, 1, mockUserId))
                .rejects.toThrow('Unauthorized');
        });
    });
}); 