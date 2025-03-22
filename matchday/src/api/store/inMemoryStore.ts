import { Tournament, User, Match, Team, UserRole, Admin, ManagementTeam, Captain } from '@/types'

class InMemoryStore {
    private tournaments: Map<string, Tournament> = new Map()
    private users: Map<string, User> = new Map()
    private matches: Map<string, Match> = new Map()
    private teams: Map<string, Team> = new Map()

    async createTournament(tournament: Tournament): Promise<Tournament> {
        this.tournaments.set(tournament.id, tournament)
        return tournament
    }

    async updateTournament(id: string, data: Partial<Tournament>): Promise<Tournament> {
        const tournament = this.tournaments.get(id)
        if (!tournament) {
            throw new Error('Tournament not found')
        }

        const updatedTournament = { ...tournament, ...data }
        this.tournaments.set(id, updatedTournament)
        return updatedTournament
    }

    async deleteTournament(id: string): Promise<void> {
        if (!this.tournaments.has(id)) {
            throw new Error('Tournament not found')
        }
        this.tournaments.delete(id)
    }

    async createUser(user: User): Promise<User> {
        this.users.set(user.id, user)
        return user
    }

    async updateUser(id: string, data: Partial<User>): Promise<User> {
        const user = this.users.get(id)
        if (!user) {
            throw new Error('User not found')
        }

        let updatedUser: User
        switch (user.role) {
            case UserRole.ADMIN:
                updatedUser = { ...user, ...data } as Admin
                break
            case UserRole.MANAGEMENT:
                updatedUser = { ...user, ...data } as ManagementTeam
                break
            case UserRole.CAPTAIN:
                updatedUser = { ...user, ...data } as Captain
                break
            default:
                throw new Error('Invalid user role')
        }

        this.users.set(id, updatedUser)
        return updatedUser
    }

    async getUserByEmail(email: string): Promise<User | null> {
        return Array.from(this.users.values()).find(user => user.email === email) || null
    }

    async getUserById(id: string): Promise<User | null> {
        return this.users.get(id) || null
    }

    async getAllUsers(): Promise<User[]> {
        return Array.from(this.users.values())
    }

    async createMatch(match: Match): Promise<Match> {
        this.matches.set(match.id, match)
        return match
    }

    async updateMatch(id: string, data: Partial<Match>): Promise<Match> {
        const match = this.matches.get(id)
        if (!match) {
            throw new Error('Match not found')
        }

        const updatedMatch = { ...match, ...data }
        this.matches.set(id, updatedMatch)
        return updatedMatch
    }

    async getMatchesByTournament(tournamentId: string): Promise<Match[]> {
        return Array.from(this.matches.values())
            .filter(match => match.tournamentId === tournamentId)
    }

    async createTeam(team: Team): Promise<Team> {
        this.teams.set(team.id, team)
        return team
    }

    async updateTeam(id: string, data: Partial<Team>): Promise<Team> {
        const team = this.teams.get(id)
        if (!team) {
            throw new Error('Team not found')
        }

        const updatedTeam = { ...team, ...data }
        this.teams.set(id, updatedTeam)
        return updatedTeam
    }

    async getTeamsByTournament(tournamentId: string): Promise<Team[]> {
        return Array.from(this.teams.values())
            .filter(team => team.tournamentIds.includes(tournamentId))
    }

    async getTeamByCaptain(captainId: string): Promise<Team | null> {
        return Array.from(this.teams.values())
            .find(team => team.captainId === captainId) || null
    }
}

export const store = new InMemoryStore() 