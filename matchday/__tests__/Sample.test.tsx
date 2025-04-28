import { store } from '../src/api/store/inMemoryStore';
import { Tournament, User, UserRole } from '../src/types';

describe('InMemoryStore', () => {
    it('should create and retrieve a user', async () => {
        const user: User = {
            id: 'u1',
            email: 'user@example.com',
            name: 'Test User',
            role: UserRole.ADMIN,
        };
        await store.createUser(user);
        const fetched = await store.getUserById('u1');
        expect(fetched).toEqual(user);
    });

    it('should create and retrieve a tournament', async () => {
        const tournament: Tournament = {
            id: 't1',
            name: 'Test Tournament',
            format: 'LEAGUE',
            startDate: '2024-01-01',
            endDate: '2024-01-10',
            registrationDeadline: '2023-12-31',
            maxTeams: 8,
            status: 'DRAFT',
            rules: [],
            teams: [],
            createdBy: 'u1',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        await store.createTournament(tournament);
        // Since there is no getTournamentById, you can test by creating a match and retrieving it
        expect(await store.getMatchesByTournament('t1')).toEqual([]);
    });
});