import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/src/firebase/config';
import { Match, MatchSchedule, PointsTable, Team } from '@/src/types';
import { updateMatchResult } from '@/src/services/matchService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

interface MatchScheduleDisplayProps {
    tournamentId: string;
    format: 'LEAGUE' | 'KNOCKOUT';
}

export function MatchScheduleDisplay({ tournamentId, format }: MatchScheduleDisplayProps) {
    const [schedule, setSchedule] = useState<MatchSchedule | null>(null);
    const [pointsTable, setPointsTable] = useState<PointsTable | null>(null);
    const [teams, setTeams] = useState<Record<string, Team>>({});
    const [scores, setScores] = useState<Record<string, { home: string; away: string }>>({});
    const [isUpdating, setIsUpdating] = useState<Record<string, boolean>>({});
    const { toast } = useToast();

    useEffect(() => {
        // Subscribe to match schedule updates
        const scheduleUnsubscribe = onSnapshot(
            doc(db, 'matchSchedules', `schedule-${tournamentId}`),
            (doc) => {
                if (doc.exists()) {
                    setSchedule(doc.data() as MatchSchedule);
                }
            },
            (error) => {
                console.error('Error listening to schedule:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to load match schedule.',
                    variant: 'destructive',
                });
            }
        );

        // If league format, subscribe to points table updates
        let pointsTableUnsubscribe = () => { };
        if (format === 'LEAGUE') {
            pointsTableUnsubscribe = onSnapshot(
                doc(db, 'pointsTables', `points-${tournamentId}`),
                (doc) => {
                    if (doc.exists()) {
                        setPointsTable(doc.data() as PointsTable);
                    }
                },
                (error) => {
                    console.error('Error listening to points table:', error);
                    toast({
                        title: 'Error',
                        description: 'Failed to load points table.',
                        variant: 'destructive',
                    });
                }
            );
        }

        return () => {
            scheduleUnsubscribe();
            pointsTableUnsubscribe();
        };
    }, [tournamentId, format, toast]);

    const handleScoreChange = (matchId: string, type: 'home' | 'away', value: string) => {
        setScores((prev) => ({
            ...prev,
            [matchId]: {
                ...prev[matchId],
                [type]: value,
            },
        }));
    };

    const handleUpdateScore = async (match: Match) => {
        const homeScore = parseInt(scores[match.id]?.home || '0');
        const awayScore = parseInt(scores[match.id]?.away || '0');

        if (isNaN(homeScore) || isNaN(awayScore)) {
            toast({
                title: 'Error',
                description: 'Please enter valid scores.',
                variant: 'destructive',
            });
            return;
        }

        try {
            setIsUpdating((prev) => ({ ...prev, [match.id]: true }));
            await updateMatchResult(match.id, schedule!.id, homeScore, awayScore);
            toast({
                title: 'Success',
                description: 'Match result has been updated.',
            });
            // Clear scores after update
            setScores((prev) => {
                const newScores = { ...prev };
                delete newScores[match.id];
                return newScores;
            });
        } catch (error) {
            console.error('Error updating match result:', error);
            toast({
                title: 'Error',
                description: 'Failed to update match result.',
                variant: 'destructive',
            });
        } finally {
            setIsUpdating((prev) => ({ ...prev, [match.id]: false }));
        }
    };

    if (!schedule) {
        return (
            <Card>
                <CardContent className="py-10">
                    <p className="text-center text-muted-foreground">No match schedule found.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Match Schedule</CardTitle>
                    <CardDescription>
                        {format === 'LEAGUE' ? 'Round-robin matches' : 'Knockout tournament bracket'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Home Team</TableHead>
                                <TableHead>Away Team</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Score</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {schedule.matches.map((match) => (
                                <TableRow key={match.id}>
                                    <TableCell>{teams[match.homeTeamId]?.name || match.homeTeamId}</TableCell>
                                    <TableCell>{teams[match.awayTeamId]?.name || match.awayTeamId}</TableCell>
                                    <TableCell>{match.status}</TableCell>
                                    <TableCell>
                                        {match.status === 'COMPLETED' ? (
                                            `${match.homeTeamScore} - ${match.awayTeamScore}`
                                        ) : (
                                            <div className="flex items-center space-x-2">
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    placeholder="Home"
                                                    className="w-20"
                                                    value={scores[match.id]?.home || ''}
                                                    onChange={(e) => handleScoreChange(match.id, 'home', e.target.value)}
                                                />
                                                <span>-</span>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    placeholder="Away"
                                                    className="w-20"
                                                    value={scores[match.id]?.away || ''}
                                                    onChange={(e) => handleScoreChange(match.id, 'away', e.target.value)}
                                                />
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {match.status !== 'COMPLETED' && (
                                            <Button
                                                size="sm"
                                                onClick={() => handleUpdateScore(match)}
                                                disabled={isUpdating[match.id]}
                                            >
                                                {isUpdating[match.id] ? 'Updating...' : 'Update Score'}
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {format === 'LEAGUE' && pointsTable && (
                <Card>
                    <CardHeader>
                        <CardTitle>League Standings</CardTitle>
                        <CardDescription>Current tournament standings</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Team</TableHead>
                                    <TableHead>P</TableHead>
                                    <TableHead>W</TableHead>
                                    <TableHead>D</TableHead>
                                    <TableHead>L</TableHead>
                                    <TableHead>GF</TableHead>
                                    <TableHead>GA</TableHead>
                                    <TableHead>GD</TableHead>
                                    <TableHead>Pts</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pointsTable.entries
                                    .sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference)
                                    .map((entry) => (
                                        <TableRow key={entry.teamId}>
                                            <TableCell>{entry.teamName}</TableCell>
                                            <TableCell>{entry.matchesPlayed}</TableCell>
                                            <TableCell>{entry.wins}</TableCell>
                                            <TableCell>{entry.draws}</TableCell>
                                            <TableCell>{entry.losses}</TableCell>
                                            <TableCell>{entry.goalsFor}</TableCell>
                                            <TableCell>{entry.goalsAgainst}</TableCell>
                                            <TableCell>{entry.goalDifference}</TableCell>
                                            <TableCell className="font-bold">{entry.points}</TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
} 