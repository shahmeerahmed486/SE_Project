import { collection, addDoc, query, where, getDocs, doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Team } from '@/src/types';

export class TeamService {
    static async createTeam(teamData: Omit<Team, 'id'>): Promise<Team> {
        try {
            // Check if tournament exists and has space
            const tournamentRef = doc(db, 'tournaments', teamData.tournamentId);
            const tournamentDoc = await getDoc(tournamentRef);

            if (!tournamentDoc.exists()) {
                throw new Error('Tournament not found');
            }

            const tournament = tournamentDoc.data();
            if (tournament.teamCount >= tournament.maxTeams) {
                throw new Error('Tournament is full');
            }

            // Check if captain already has a team in this tournament
            const existingTeamQuery = query(
                collection(db, 'teams'),
                where('tournamentId', '==', teamData.tournamentId),
                where('captainId', '==', teamData.captainId)
            );
            const existingTeamSnapshot = await getDocs(existingTeamQuery);

            if (!existingTeamSnapshot.empty) {
                throw new Error('You already have a team registered in this tournament');
            }

            // Create team
            const teamRef = await addDoc(collection(db, 'teams'), teamData);

            // Update tournament team count
            await updateDoc(tournamentRef, {
                teamCount: increment(1)
            });

            return {
                id: teamRef.id,
                ...teamData
            };
        } catch (error) {
            console.error('Error creating team:', error);
            throw error;
        }
    }

    static async getTeamsByTournament(tournamentId: string): Promise<Team[]> {
        try {
            const teamsQuery = query(
                collection(db, 'teams'),
                where('tournamentId', '==', tournamentId)
            );

            const teamsSnapshot = await getDocs(teamsQuery);
            return teamsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Team[];
        } catch (error) {
            console.error('Error fetching teams:', error);
            throw error;
        }
    }

    static async getTeamById(teamId: string): Promise<Team | null> {
        try {
            const teamDoc = await getDoc(doc(db, 'teams', teamId));
            if (!teamDoc.exists()) {
                return null;
            }
            return {
                id: teamDoc.id,
                ...teamDoc.data()
            } as Team;
        } catch (error) {
            console.error('Error fetching team:', error);
            throw error;
        }
    }
} 