import { User, UserRole } from '../models/User';
import { Tournament, TournamentStatus } from '../models/Tournament';
import { Team } from '../models/Team';
import { Match, MatchStatus } from '../models/Match';
import { Announcement } from '../models/Announcement';

class InMemoryStore {
    private users: Map<string, User> = new Map();
    private tournaments: Map<string, Tournament> = new Map();
    private teams: Map<string, Team> = new Map();
    private matches: Map<string, Match> = new Map();
    private announcements: Map<string, Announcement> = new Map();

    // User methods
    async createUser(user: User): Promise<User> {
        this.users.set(user.id, user);
        return user;
    }

    async updateUser(id: string, data: Partial<User>): Promise<User> {
        const user = await this.getUserById(id);
        if (!user) throw new Error('User not found');

        const updatedUser = { ...user, ...data, updatedAt: new Date() };
        this.users.set(id, updatedUser);
        return updatedUser;
    }

    async deleteUser(id: string): Promise<void> {
        if (!this.users.delete(id)) throw new Error('User not found');
    }

    async getUserById(id: string): Promise<User | null> {
        return this.users.get(id) || null;
    }

    async getUserByEmail(email: string): Promise<User | null> {
        return Array.from(this.users.values()).find(user => user.email === email) || null;
    }

    // Tournament methods
    async createTournament(tournament: Tournament): Promise<Tournament> {
        this.tournaments.set(tournament.id, tournament);
        return tournament;
    }

    async updateTournament(id: string, data: Partial<Tournament>): Promise<Tournament> {
        const tournament = await this.getTournamentById(id);
        if (!tournament) throw new Error('Tournament not found');

        const updatedTournament = { ...tournament, ...data, updatedAt: new Date() };
        this.tournaments.set(id, updatedTournament);
        return updatedTournament;
    }

    async deleteTournament(id: string): Promise<void> {
        if (!this.tournaments.delete(id)) throw new Error('Tournament not found');
    }

    async getTournamentById(id: string): Promise<Tournament | null> {
        return this.tournaments.get(id) || null;
    }

    async getAllTournaments(): Promise<Tournament[]> {
        return Array.from(this.tournaments.values());
    }

    // Team methods
    async createTeam(team: Team): Promise<Team> {
        this.teams.set(team.id, team);
        return team;
    }

    async getTeamById(id: string): Promise<Team | null> {
        return this.teams.get(id) || null;
    }

    async updateTeam(id: string, data: Partial<Team>): Promise<Team> {
        const team = await this.getTeamById(id);
        if (!team) throw new Error('Team not found');

        const updatedTeam = { ...team, ...data, updatedAt: new Date() };
        this.teams.set(id, updatedTeam);
        return updatedTeam;
    }

    async deleteTeam(id: string): Promise<void> {
        if (!this.teams.delete(id)) throw new Error('Team not found');
    }

    // Match methods
    async createMatch(match: Match): Promise<Match> {
        this.matches.set(match.id, match);
        return match;
    }

    async getMatchesByTournament(tournamentId: string): Promise<Match[]> {
        return Array.from(this.matches.values())
            .filter(match => match.tournamentId === tournamentId);
    }

    async updateMatchResult(id: string, scoreA: number, scoreB: number): Promise<Match> {
        const match = this.matches.get(id);
        if (!match) throw new Error('Match not found');

        const updatedMatch = {
            ...match,
            scoreA,
            scoreB,
            status: MatchStatus.COMPLETED,
            updatedAt: new Date()
        };
        this.matches.set(id, updatedMatch);
        return updatedMatch;
    }

    // Announcement methods
    async createAnnouncement(announcement: Announcement): Promise<Announcement> {
        this.announcements.set(announcement.id, announcement);
        return announcement;
    }

    async getAnnouncementById(id: string): Promise<Announcement | null> {
        return this.announcements.get(id) || null;
    }

    async getAllAnnouncements(): Promise<Announcement[]> {
        return Array.from(this.announcements.values());
    }

    async updateAnnouncement(id: string, data: Partial<Announcement>): Promise<Announcement> {
        const announcement = await this.getAnnouncementById(id);
        if (!announcement) throw new Error('Announcement not found');

        const updatedAnnouncement = { ...announcement, ...data, updatedAt: new Date() };
        this.announcements.set(id, updatedAnnouncement);
        return updatedAnnouncement;
    }

    async deleteAnnouncement(id: string): Promise<void> {
        if (!this.announcements.delete(id)) throw new Error('Announcement not found');
    }
}

export const store = new InMemoryStore(); 