import { createMatchSchedule, updateMatchResult } from '@/src/services/matchService';
import { doc, getDoc, updateDoc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Mock Firebase
jest.mock('firebase/firestore', () => ({
    doc: jest.fn(),
    getDoc: jest.fn(),
    updateDoc: jest.fn(),
    collection: jest.fn(),
    addDoc: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    getDocs: jest.fn()
}));

// TC18: Test matchService functionality
describe('matchService', () => {
    const mockTournamentId = 't1';
    const mockScheduleId = 'schedule-t1';
    const mockMatchId = 'm1';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // TC19: Test successful match schedule creation
    it('creates match schedule successfully', async () => {
        const mockTournamentDoc = {
            exists: () => true,
            data: () => ({
                format: 'LEAGUE',
                status: 'REGISTRATION_CLOSED',
                teamCount: 4
            })
        };

        (getDoc as jest.Mock).mockResolvedValueOnce(mockTournamentDoc);
        (getDocs as jest.Mock).mockResolvedValueOnce({
            empty: false,
            docs: [
                { id: 't1', data: () => ({ name: 'Team 1' }) },
                { id: 't2', data: () => ({ name: 'Team 2' }) },
                { id: 't3', data: () => ({ name: 'Team 3' }) },
                { id: 't4', data: () => ({ name: 'Team 4' }) }
            ]
        });

        await createMatchSchedule(mockTournamentId);

        expect(getDoc).toHaveBeenCalledWith(doc(db, 'tournaments', mockTournamentId));
        expect(updateDoc).toHaveBeenCalled();
    });

    // TC20: Test match schedule creation with invalid tournament
    it('handles invalid tournament error', async () => {
        const mockTournamentDoc = {
            exists: () => false
        };

        (getDoc as jest.Mock).mockResolvedValueOnce(mockTournamentDoc);

        await expect(createMatchSchedule(mockTournamentId)).rejects.toThrow('Tournament not found');
    });

    // TC21: Test successful match result update
    it('updates match result successfully', async () => {
        const mockMatchDoc = {
            exists: () => true,
            data: () => ({
                homeTeamScore: 0,
                awayTeamScore: 0,
                status: 'SCHEDULED'
            })
        };

        (getDoc as jest.Mock).mockResolvedValueOnce(mockMatchDoc);

        await updateMatchResult(mockMatchId, mockScheduleId, 2, 1);

        expect(updateDoc).toHaveBeenCalledWith(
            doc(db, 'matches', mockMatchId),
            expect.objectContaining({
                homeTeamScore: 2,
                awayTeamScore: 1,
                status: 'COMPLETED'
            })
        );
    });

    // TC22: Test match result update with invalid match
    it('handles invalid match error', async () => {
        const mockMatchDoc = {
            exists: () => false
        };

        (getDoc as jest.Mock).mockResolvedValueOnce(mockMatchDoc);

        await expect(updateMatchResult(mockMatchId, mockScheduleId, 2, 1))
            .rejects.toThrow('Match not found');
    });
}); 