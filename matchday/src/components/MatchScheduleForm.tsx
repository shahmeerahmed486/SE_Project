import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { createMatchSchedule } from '@/src/services/matchService';
import { Tournament, TournamentStatus } from '@/src/types';

interface MatchScheduleFormProps {
    tournament: Tournament;
    onScheduleCreated: () => void;
}

export function MatchScheduleForm({ tournament, onScheduleCreated }: MatchScheduleFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleCreateSchedule = async () => {
        if (!tournament?.id) {
            toast({
                title: 'Error',
                description: 'Invalid tournament data.',
                variant: 'destructive',
            });
            return;
        }

        try {
            setIsLoading(true);
            await createMatchSchedule(tournament.id);
            toast({
                title: 'Success',
                description: 'Match schedule has been created successfully.',
            });
            onScheduleCreated();
        } catch (error) {
            console.error('Error creating match schedule:', error);
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to create match schedule. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const canCreateSchedule = tournament.status === TournamentStatus.REGISTRATION_CLOSED ||
        tournament.status === TournamentStatus.ONGOING;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Create Match Schedule</CardTitle>
                <CardDescription>
                    Generate a {tournament.format.toLowerCase()} format match schedule for all registered teams.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                        {tournament.format === 'LEAGUE' ? (
                            <p>
                                This will create a round-robin schedule where each team plays against every other team once.
                                A points table will also be initialized for tracking team standings.
                            </p>
                        ) : (
                            <p>
                                This will create a knockout tournament bracket where teams will be randomly paired for the first round.
                                Winners will advance to the next round.
                            </p>
                        )}
                    </div>
                    <Button
                        onClick={handleCreateSchedule}
                        disabled={!canCreateSchedule || isLoading}
                        className="w-full"
                    >
                        {isLoading ? 'Creating Schedule...' : 'Create Schedule'}
                    </Button>
                    {!canCreateSchedule && (
                        <p className="text-sm text-red-500">
                            Match schedule can only be created when tournament registration is closed or the tournament is ongoing.
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
} 