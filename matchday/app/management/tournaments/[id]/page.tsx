"use client"

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/src/firebase/config';
import { Tournament, TournamentStatus } from '@/src/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { MatchScheduleForm } from '@/src/components/MatchScheduleForm';
import { MatchScheduleDisplay } from '@/src/components/MatchScheduleDisplay';

export default function TournamentManagementPage() {
    const params = useParams();
    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchTournament = async () => {
            try {
                const tournamentDoc = await getDoc(doc(db, 'tournaments', params.id as string));
                if (tournamentDoc.exists()) {
                    setTournament(tournamentDoc.data() as Tournament);
                } else {
                    toast({
                        title: 'Error',
                        description: 'Tournament not found.',
                        variant: 'destructive',
                    });
                }
            } catch (error) {
                console.error('Error fetching tournament:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to load tournament details.',
                    variant: 'destructive',
                });
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchTournament();
        }
    }, [params.id, toast]);

    if (loading) {
        return (
            <div className="container flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!tournament) {
        return null;
    }

    const canManageSchedule = tournament.status === TournamentStatus.REGISTRATION_CLOSED ||
        tournament.status === TournamentStatus.ONGOING;

    return (
        <div className="container py-10">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{tournament.name}</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">{tournament.description}</p>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="teams">Teams</TabsTrigger>
                    <TabsTrigger value="schedule">Schedule</TabsTrigger>
                    <TabsTrigger value="announcements">Announcements</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                    <Card>
                        <CardHeader>
                            <CardTitle>Tournament Details</CardTitle>
                            <CardDescription>Basic information about the tournament</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Format</p>
                                    <p className="text-lg">{tournament.format}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                                    <p className="text-lg">{tournament.status}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Teams</p>
                                    <p className="text-lg">{tournament.teamCount}/{tournament.maxTeams}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Location</p>
                                    <p className="text-lg">{tournament.location}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="schedule">
                    <div className="space-y-6">
                        {canManageSchedule && (
                            <MatchScheduleForm
                                tournament={tournament}
                                onScheduleCreated={() => {
                                    toast({
                                        title: 'Success',
                                        description: 'Match schedule has been created.',
                                    });
                                }}
                            />
                        )}
                        <MatchScheduleDisplay
                            tournamentId={tournament.id}
                            format={tournament.format as 'LEAGUE' | 'KNOCKOUT'}
                        />
                    </div>
                </TabsContent>

                {/* Other tabs will be implemented separately */}
                <TabsContent value="teams">
                    <Card>
                        <CardContent className="py-10">
                            <p className="text-center text-muted-foreground">Teams management will be implemented separately.</p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="announcements">
                    <Card>
                        <CardContent className="py-10">
                            <p className="text-center text-muted-foreground">Announcements will be implemented separately.</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
} 