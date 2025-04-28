import { TeamService } from '../../src/services/team/TeamService';
import { doc, getDoc, updateDoc, collection, addDoc, query, where, getDocs, increment } from 'firebase/firestore';
import { db } from '../../lib/firebase';

// Mock Firebase
jest.mock('firebase/firestore', () => ({
    doc: jest.fn(),
    getDoc: jest.fn(),
    updateDoc: jest.fn(),
    collection: jest.fn(),
    addDoc: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    getDocs: jest.fn(),
    increment: jest.fn()
}));

// TC30: Test TeamService functionality
describe('TeamService', () => {
    const mockTeamId = 'team1';
    const mockTournamentId = 'tournament1';
    const mockTeam = {
        name: 'Test Team',
        tournamentId: mockTournamentId,
        captainId: 'player1',
        players: [
            { name: 'Player 1', position: 'Forward', number: '10' },
            { name: 'Player 2', position: 'Midfielder', number: '8' }
        ],
        eliminated: false,
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // TC31: Test successful team creation
    it('creates team successfully', async () => {
        const mockDocRef = { id: mockTeamId };
        const mockTournamentDoc = {
            exists: () => true,
            data: () => ({
                teamCount: 0,
                maxTeams: 8
            })
        };

        (getDoc as jest.Mock).mockResolvedValueOnce(mockTournamentDoc);
        (getDocs as jest.Mock).mockResolvedValueOnce({ empty: true });
        (addDoc as jest.Mock).mockResolvedValueOnce(mockDocRef);

        const result = await TeamService.createTeam(mockTeam);

        expect(addDoc).toHaveBeenCalledWith(
            collection(db, 'teams'),
            expect.objectContaining(mockTeam)
        );
        expect(result.id).toBe(mockTeamId);
    });

    // TC32: Test team creation with full tournament
    it('handles full tournament error', async () => {
        const mockTournamentDoc = {
            exists: () => true,
            data: () => ({
                teamCount: 8,
                maxTeams: 8
            })
        };

        (getDoc as jest.Mock).mockResolvedValueOnce(mockTournamentDoc);

        await expect(TeamService.createTeam(mockTeam)).rejects.toThrow('Tournament is full');
    });

    // TC33: Test team creation with existing team
    it('handles existing team error', async () => {
        const mockTournamentDoc = {
            exists: () => true,
            data: () => ({
                teamCount: 0,
                maxTeams: 8
            })
        };

        (getDoc as jest.Mock).mockResolvedValueOnce(mockTournamentDoc);
        (getDocs as jest.Mock).mockResolvedValueOnce({ empty: false });

        await expect(TeamService.createTeam(mockTeam)).rejects.toThrow('You already have a team registered in this tournament');
    });

    // TC34: Test successful team retrieval by tournament
    it('gets teams by tournament successfully', async () => {
        const mockQuerySnapshot = {
            docs: [
                { id: 'team1', data: () => mockTeam },
                { id: 'team2', data: () => ({ ...mockTeam, name: 'Team 2' }) }
            ]
        };

        (getDocs as jest.Mock).mockResolvedValueOnce(mockQuerySnapshot);

        const result = await TeamService.getTeamsByTournament(mockTournamentId);

        expect(result).toHaveLength(2);
        expect(result[0]).toEqual(expect.objectContaining(mockTeam));
    });

    // TC35: Test successful team retrieval by ID
    it('gets team by ID successfully', async () => {
        const mockTeamDoc = {
            exists: () => true,
            data: () => mockTeam
        };

        (getDoc as jest.Mock).mockResolvedValueOnce(mockTeamDoc);

        const result = await TeamService.getTeamById(mockTeamId);

        expect(result).toEqual(expect.objectContaining(mockTeam));
    });

    // TC36: Test team retrieval with invalid team ID
    it('handles invalid team ID', async () => {
        const mockTeamDoc = {
            exists: () => false
        };

        (getDoc as jest.Mock).mockResolvedValueOnce(mockTeamDoc);

        const result = await TeamService.getTeamById(mockTeamId);

        expect(result).toBeNull();
    });
}); 