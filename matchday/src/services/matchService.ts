import { db } from '@/src/firebase/config';
import { collection, doc, getDoc, setDoc, updateDoc, query, where, getDocs } from 'firebase/firestore';
import { Match, MatchSchedule, PointsTable, Team, Tournament, TournamentFormat, TournamentStatus } from '@/src/types';

// Helper function to generate round-robin schedule
const generateRoundRobinSchedule = (teams: Team[]): Match[] => {
    const matches: Match[] = [];
    const n = teams.length;

    // If odd number of teams, add a dummy team
    const actualTeams = n % 2 === 0 ? teams : [...teams, null];
    const numRounds = actualTeams.length - 1;
    const halfSize = actualTeams.length / 2;

    const teamIds = actualTeams.map(team => team?.id);

    for (let round = 0; round < numRounds; round++) {
        for (let i = 0; i < halfSize; i++) {
            const teamA = teamIds[i];
            const teamB = teamIds[teamIds.length - 1 - i];

            // Skip matches involving the dummy team
            if (teamA && teamB) {
                matches.push({
                    id: `${round}-${teamA}-${teamB}`,
                    tournamentId: teams[0].tournamentId,
                    teamA,
                    teamB,
                    scoreA: null,
                    scoreB: null,
                    date: '',
                    time: '',
                    location: '',
                    status: 'SCHEDULED',
                    round: round.toString(),
                    createdBy: 'system',
                    createdAt: new Date(),
                    updatedAt: new Date().toISOString()
                });
            }
        }

        // Rotate teams for next round
        teamIds.splice(1, 0, teamIds.pop()!);
    }

    return matches;
};

// Helper function to generate knockout schedule
const generateKnockoutSchedule = (teams: Team[]): Match[] => {
    const matches: Match[] = [];
    const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);

    for (let i = 0; i < shuffledTeams.length - 1; i += 2) {
        matches.push({
            id: `round1-${shuffledTeams[i].id}-${shuffledTeams[i + 1].id}`,
            tournamentId: teams[0].tournamentId,
            teamA: shuffledTeams[i].id,
            teamB: shuffledTeams[i + 1].id,
            scoreA: null,
            scoreB: null,
            date: '',
            time: '',
            location: '',
            status: 'SCHEDULED',
            round: '1',
            createdBy: 'system',
            createdAt: new Date(),
            updatedAt: new Date().toISOString()
        });
    }

    return matches;
};

// Initialize points table for league format
const initializePointsTable = async (tournamentId: string, teams: Team[]): Promise<void> => {
    const pointsTable: PointsTable = {
        id: `points-${tournamentId}`,
        tournamentId,
        entries: teams.map(team => ({
            teamId: team.id,
            teamName: team.name,
            matchesPlayed: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            goalDifference: 0,
            points: 0
        })),
        lastUpdated: new Date().toISOString()
    };

    await setDoc(doc(db, 'pointsTables', pointsTable.id), pointsTable);
};

// Create match schedule
export const createMatchSchedule = async (tournamentId: string): Promise<void> => {
    if (!tournamentId) {
        throw new Error('Tournament ID is required');
    }

    try {
        // Get tournament details
        const tournamentDoc = await getDoc(doc(db, 'tournaments', tournamentId));
        if (!tournamentDoc.exists()) {
            throw new Error('Tournament not found');
        }

        const tournament = tournamentDoc.data() as Tournament;

        // Check if tournament is in correct status
        if (tournament.status !== TournamentStatus.REGISTRATION_CLOSED &&
            tournament.status !== TournamentStatus.ONGOING) {
            throw new Error('Tournament must be in Registration Closed or Ongoing status to create schedule');
        }

        // Get all teams in the tournament
        const teamsQuery = query(
            collection(db, 'teams'),
            where('tournamentId', '==', tournamentId)
        );
        const teamsSnapshot = await getDocs(teamsQuery);
        const teams = teamsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Team[];

        if (teams.length < 2) {
            throw new Error('Not enough teams to create a schedule');
        }

        // Generate matches based on tournament format
        const matches = tournament.format === TournamentFormat.LEAGUE
            ? generateRoundRobinSchedule(teams)
            : generateKnockoutSchedule(teams);

        // Create match schedule
        const schedule: MatchSchedule = {
            id: `schedule-${tournamentId}`,
            tournamentId,
            matches: matches.map(match => match.id),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Save schedule to Firebase
        await setDoc(doc(db, 'matchSchedules', schedule.id), schedule);

        // Save matches to Firebase
        for (const match of matches) {
            await setDoc(doc(db, 'matches', match.id), match);
        }

        // If league format, initialize points table
        if (tournament.format === TournamentFormat.LEAGUE) {
            await initializePointsTable(tournamentId, teams);
        }

        // Update tournament status to ongoing if it was in registration closed
        if (tournament.status === TournamentStatus.REGISTRATION_CLOSED) {
            await updateDoc(doc(db, 'tournaments', tournamentId), {
                status: TournamentStatus.ONGOING
            });
        }
    } catch (error) {
        console.error('Error creating match schedule:', error);
        throw error;
    }
};

// Update match result
export const updateMatchResult = async (
    matchId: string,
    scheduleId: string,
    scoreA: number,
    scoreB: number
): Promise<void> => {
    if (!matchId || !scheduleId) {
        throw new Error('Match ID and Schedule ID are required');
    }

    if (typeof scoreA !== 'number' || typeof scoreB !== 'number' || isNaN(scoreA) || isNaN(scoreB)) {
        throw new Error('Invalid scores provided');
    }

    try {
        // Get the match
        const matchDoc = await getDoc(doc(db, 'matches', matchId));
        if (!matchDoc.exists()) {
            throw new Error('Match not found');
        }

        const match = matchDoc.data() as Match;

        // Validate match status
        if (match.status === 'COMPLETED') {
            throw new Error('Match is already completed');
        }

        // Update match
        await updateDoc(doc(db, 'matches', matchId), {
            scoreA,
            scoreB,
            status: 'COMPLETED',
            updatedAt: new Date().toISOString()
        });

        // If league format, update points table
        const scheduleDoc = await getDoc(doc(db, 'matchSchedules', scheduleId));
        if (!scheduleDoc.exists()) {
            throw new Error('Schedule not found');
        }

        const schedule = scheduleDoc.data() as MatchSchedule;
        const tournamentDoc = await getDoc(doc(db, 'tournaments', schedule.tournamentId));
        if (!tournamentDoc.exists()) {
            throw new Error('Tournament not found');
        }

        const tournament = tournamentDoc.data() as Tournament;
        if (tournament.format === TournamentFormat.LEAGUE) {
            const pointsTableDoc = await getDoc(doc(db, 'pointsTables', `points-${schedule.tournamentId}`));
            if (!pointsTableDoc.exists()) {
                throw new Error('Points table not found');
            }

            const pointsTable = pointsTableDoc.data() as PointsTable;
            const teamAEntry = pointsTable.entries.find(e => e.teamId === match.teamA);
            const teamBEntry = pointsTable.entries.find(e => e.teamId === match.teamB);

            if (!teamAEntry || !teamBEntry) {
                throw new Error('Team entries not found in points table');
            }

            // Update stats
            teamAEntry.matchesPlayed++;
            teamBEntry.matchesPlayed++;
            teamAEntry.goalsFor += scoreA;
            teamAEntry.goalsAgainst += scoreB;
            teamBEntry.goalsFor += scoreB;
            teamBEntry.goalsAgainst += scoreA;

            if (scoreA > scoreB) {
                teamAEntry.wins++;
                teamAEntry.points += 3;
                teamBEntry.losses++;
            } else if (scoreB > scoreA) {
                teamBEntry.wins++;
                teamBEntry.points += 3;
                teamAEntry.losses++;
            } else {
                teamAEntry.draws++;
                teamBEntry.draws++;
                teamAEntry.points++;
                teamBEntry.points++;
            }

            teamAEntry.goalDifference = teamAEntry.goalsFor - teamAEntry.goalsAgainst;
            teamBEntry.goalDifference = teamBEntry.goalsFor - teamBEntry.goalsAgainst;

            await updateDoc(doc(db, 'pointsTables', pointsTable.id), {
                entries: pointsTable.entries,
                lastUpdated: new Date().toISOString()
            });
        }
    } catch (error) {
        console.error('Error updating match result:', error);
        throw error;
    }
};

// Get matches for a tournament
export const getMatchesByTournament = async (tournamentId: string): Promise<Match[]> => {
    if (!tournamentId) {
        throw new Error('Tournament ID is required');
    }

    try {
        // Get the match schedule
        const scheduleDoc = await getDoc(doc(db, 'matchSchedules', `schedule-${tournamentId}`));
        if (!scheduleDoc.exists()) {
            return []; // Return empty array if no schedule exists
        }

        const schedule = scheduleDoc.data() as MatchSchedule;

        // Fetch all matches in parallel
        const matchPromises = schedule.matches.map(matchId =>
            getDoc(doc(db, 'matches', matchId))
        );

        const matchDocs = await Promise.all(matchPromises);

        return matchDocs
            .filter(doc => doc.exists())
            .map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Match[];
    } catch (error) {
        console.error('Error fetching matches:', error);
        throw error;
    }
};

// Update match details
export const updateMatchDetails = async (
    matchId: string,
    details: {
        date?: string;
        time?: string;
        location?: string;
        status?: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
    }
): Promise<void> => {
    if (!matchId) {
        throw new Error('Match ID is required');
    }

    try {
        const matchDoc = await getDoc(doc(db, 'matches', matchId));
        if (!matchDoc.exists()) {
            throw new Error('Match not found');
        }

        await updateDoc(doc(db, 'matches', matchId), {
            ...details,
            updatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error updating match details:', error);
        throw error;
    }
};

export class MatchService {
    // ... existing code ...
}

export const matchService = new MatchService(); 