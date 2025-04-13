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
            const homeTeamId = teamIds[i];
            const awayTeamId = teamIds[teamIds.length - 1 - i];

            // Skip matches involving the dummy team
            if (homeTeamId && awayTeamId) {
                matches.push({
                    id: `${round}-${homeTeamId}-${awayTeamId}`,
                    tournamentId: teams[0].tournamentId,
                    homeTeamId,
                    awayTeamId,
                    status: 'SCHEDULED',
                    matchDate: '', // To be set later
                    createdAt: new Date().toISOString(),
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
            homeTeamId: shuffledTeams[i].id,
            awayTeamId: shuffledTeams[i + 1].id,
            status: 'SCHEDULED',
            round: 1,
            matchDate: '', // To be set later
            createdAt: new Date().toISOString(),
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
            format: tournament.format as TournamentFormat,
            matches,
            currentRound: tournament.format === TournamentFormat.KNOCKOUT ? 1 : undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Save schedule to Firebase
        await setDoc(doc(db, 'matchSchedules', schedule.id), schedule);

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
    homeTeamScore: number,
    awayTeamScore: number
): Promise<void> => {
    if (!matchId || !scheduleId) {
        throw new Error('Match ID and Schedule ID are required');
    }

    try {
        // Get the schedule
        const scheduleDoc = await getDoc(doc(db, 'matchSchedules', scheduleId));
        if (!scheduleDoc.exists()) {
            throw new Error('Schedule not found');
        }

        const schedule = scheduleDoc.data() as MatchSchedule;
        const matchIndex = schedule.matches.findIndex(m => m.id === matchId);
        if (matchIndex === -1) {
            throw new Error('Match not found');
        }

        // Update match
        const match = schedule.matches[matchIndex];
        match.homeTeamScore = homeTeamScore;
        match.awayTeamScore = awayTeamScore;
        match.status = 'COMPLETED';
        match.winner = homeTeamScore > awayTeamScore ? match.homeTeamId
            : awayTeamScore > homeTeamScore ? match.awayTeamId
                : undefined;
        match.updatedAt = new Date().toISOString();

        // Update schedule
        schedule.matches[matchIndex] = match;
        await updateDoc(doc(db, 'matchSchedules', scheduleId), { matches: schedule.matches });

        // If league format, update points table
        if (schedule.format === 'LEAGUE') {
            const pointsTableDoc = await getDoc(doc(db, 'pointsTables', `points-${schedule.tournamentId}`));
            if (!pointsTableDoc.exists()) {
                throw new Error('Points table not found');
            }

            const pointsTable = pointsTableDoc.data() as PointsTable;
            const homeTeamEntry = pointsTable.entries.find(e => e.teamId === match.homeTeamId);
            const awayTeamEntry = pointsTable.entries.find(e => e.teamId === match.awayTeamId);

            if (homeTeamEntry && awayTeamEntry) {
                // Update stats
                homeTeamEntry.matchesPlayed++;
                awayTeamEntry.matchesPlayed++;
                homeTeamEntry.goalsFor += homeTeamScore;
                homeTeamEntry.goalsAgainst += awayTeamScore;
                awayTeamEntry.goalsFor += awayTeamScore;
                awayTeamEntry.goalsAgainst += homeTeamScore;

                if (homeTeamScore > awayTeamScore) {
                    homeTeamEntry.wins++;
                    homeTeamEntry.points += 3;
                    awayTeamEntry.losses++;
                } else if (awayTeamScore > homeTeamScore) {
                    awayTeamEntry.wins++;
                    awayTeamEntry.points += 3;
                    homeTeamEntry.losses++;
                } else {
                    homeTeamEntry.draws++;
                    awayTeamEntry.draws++;
                    homeTeamEntry.points++;
                    awayTeamEntry.points++;
                }

                homeTeamEntry.goalDifference = homeTeamEntry.goalsFor - homeTeamEntry.goalsAgainst;
                awayTeamEntry.goalDifference = awayTeamEntry.goalsFor - awayTeamEntry.goalsAgainst;
            }

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