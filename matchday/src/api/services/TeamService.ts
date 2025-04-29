import { Team, Player, UserRole } from '@/src/types'
import { store } from '../store/inMemoryStore'
import { AuthService } from './AuthService'
import { doc, setDoc, Firestore } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface TeamCreate {
    name: string;
    players: Array<{
        name: string;
        position: string;
        number: string;
    }>;
    tournamentId: string;
}

export class TeamService {
    private static db: Firestore

    static initialize(dbInstance: Firestore) {
        this.db = dbInstance
    }

    static async createTeam(data: TeamCreate, captainId: string): Promise<Team> {
        const user = await AuthService.validateUserRole(captainId, [UserRole.CAPTAIN])

        // Check if captain already has a team
        const existingTeam = await store.getTeamByCaptain(captainId)
        if (existingTeam) {
            throw new Error('Captain already has a team')
        }

        const team: Team = {
            id: crypto.randomUUID(),
            name: data.name,
            eliminated: false,
            captainId,
            players: data.players.map(player => ({
                id: crypto.randomUUID(),
                name: player.name,
                position: player.position,
                number: player.number,
                teamId: '', // Will be set after team creation
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            })),
            tournamentId: data.tournamentId,
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }

        // Set teamId for all players
        team.players = team.players.map(player => ({
            ...player,
            teamId: team.id
        }))

        await setDoc(doc(this.db, 'teams', team.id), team)
        await store.createTeam(team)

        // Update captain's teamId
        await store.updateUser(captainId, { teamId: team.id })

        return team
    }

    static async updateTeam(
        id: string,
        data: Partial<Omit<Team, 'id' | 'captainId'>>,
        userId: string
    ): Promise<Team> {
        const team = await store.getTeamByCaptain(userId)
        if (!team || team.id !== id) {
            throw new Error('Unauthorized: Only team captain can update team details')
        }

        const updateData = {
            ...data,
            updatedAt: new Date().toISOString()
        }

        await setDoc(doc(this.db, 'teams', id), { ...team, ...updateData }, { merge: true })
        return store.updateTeam(id, updateData)
    }

    static async addPlayerToTeam(
        teamId: string,
        playerData: { name: string; position: string; number: string },
        userId: string
    ): Promise<Team> {
        const team = await store.getTeamByCaptain(userId)
        if (!team || team.id !== teamId) {
            throw new Error('Unauthorized: Only team captain can add players')
        }

        const newPlayer: Player = {
            id: crypto.randomUUID(),
            name: playerData.name,
            position: playerData.position,
            number: playerData.number,
            teamId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }

        const updatedTeam = {
            ...team,
            players: [...team.players, newPlayer],
            updatedAt: new Date().toISOString()
        }

        await setDoc(doc(this.db, 'teams', teamId), updatedTeam)
        return store.updateTeam(teamId, updatedTeam)
    }

    static async removePlayerFromTeam(
        teamId: string,
        playerId: string,
        userId: string
    ): Promise<Team> {
        const team = await store.getTeamByCaptain(userId)
        if (!team || team.id !== teamId) {
            throw new Error('Unauthorized: Only team captain can remove players')
        }

        const updatedTeam = {
            ...team,
            players: team.players.filter(p => p.id !== playerId),
            updatedAt: new Date().toISOString()
        }

        await setDoc(doc(this.db, 'teams', teamId), updatedTeam)
        return store.updateTeam(teamId, updatedTeam)
    }
} 