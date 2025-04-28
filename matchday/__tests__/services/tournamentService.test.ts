import { TournamentService } from '../../src/api/services/TournamentService';
import { doc, getDoc, updateDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { TournamentFormat, TournamentStatus } from '../../src/types';

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

// TC23: Test tournamentService functionality
describe('tournamentService', () => {
    const mockTournamentId = 't1';
    const mockTournament = {
        name: 'Test Tournament',
        description: 'Test Description',
        format: TournamentFormat.LEAGUE,
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        registrationDeadline: '2023-12-31',
        location: 'Test Location',
        teamLimit: 8
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // TC24: Test successful tournament creation
    it('creates tournament successfully', async () => {
        const mockDocRef = { id: mockTournamentId };
        (addDoc as jest.Mock).mockResolvedValueOnce(mockDocRef);

        const result = await TournamentService.createTournament(mockTournament, 'user1');

        expect(addDoc).toHaveBeenCalledWith(
            collection(db, 'tournaments'),
            expect.objectContaining({
                name: mockTournament.name,
                description: mockTournament.description,
                format: mockTournament.format,
                startDate: mockTournament.startDate,
                endDate: mockTournament.endDate,
                registrationDeadline: mockTournament.registrationDeadline,
                location: mockTournament.location,
                status: TournamentStatus.DRAFT,
                teamCount: 0,
                maxTeams: mockTournament.teamLimit,
                rules: []
            })
        );
        expect(result.id).toBe(mockTournamentId);
    });

    // TC25: Test successful tournament update
    it('updates tournament successfully', async () => {
        const mockTournamentDoc = {
            exists: () => true
        };

        (getDoc as jest.Mock).mockResolvedValueOnce(mockTournamentDoc);

        await TournamentService.updateTournament(mockTournamentId, {
            name: 'Updated Tournament Name'
        }, 'user1');

        expect(updateDoc).toHaveBeenCalledWith(
            doc(db, 'tournaments', mockTournamentId),
            expect.objectContaining({
                name: 'Updated Tournament Name',
                updatedAt: expect.any(String)
            })
        );
    });

    // TC26: Test tournament update with invalid tournament
    it('handles invalid tournament error', async () => {
        const mockTournamentDoc = {
            exists: () => false
        };

        (getDoc as jest.Mock).mockResolvedValueOnce(mockTournamentDoc);

        await expect(TournamentService.updateTournament(mockTournamentId, {
            name: 'Updated Tournament Name'
        }, 'user1')).rejects.toThrow('Tournament not found');
    });
}); 