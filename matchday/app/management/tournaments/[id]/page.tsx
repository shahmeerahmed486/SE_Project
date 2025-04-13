"use client"

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/src/firebase/config';
import { Tournament } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import TournamentOverview from '@/components/tournament/management/TournamentOverview';
import TournamentTeams from '@/components/tournament/management/TournamentTeams';
import TournamentSchedule from '@/components/tournament/management/TournamentSchedule';
import TournamentAnnouncements from '@/components/tournament/management/TournamentAnnouncements';
import { Spinner } from '@/components/ui/spinner';

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
                    setTournament({
                        ...tournamentDoc.data() as Tournament,
                        id: tournamentDoc.id
                    });
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

    const updateTournament = (updatedData: Partial<Tournament>) => {
        if (tournament) {
            setTournament({
                ...tournament,
                ...updatedData,
            });
        }
    };

    if (loading) {
        return (
            <div className="container flex justify-center items-center min-h-screen">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!tournament) {
        return (
            <div className="container py-10">
                <div className="p-8 text-center">
                    <h2 className="text-2xl font-bold mb-2">Tournament Not Found</h2>
                    <p className="text-muted-foreground">The requested tournament could not be found or you don't have permission to view it.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container py-10">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">{tournament.name}</h1>
                <div className="flex items-center gap-3 mt-2">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                        {tournament.format}
                    </span>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-secondary/10 text-secondary">
                        {tournament.status}
                    </span>
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="teams">Teams</TabsTrigger>
                    <TabsTrigger value="schedule">Schedule</TabsTrigger>
                    <TabsTrigger value="announcements">Announcements</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                    <TournamentOverview 
                        tournament={tournament} 
                        updateTournament={updateTournament} 
                    />
                </TabsContent>

                <TabsContent value="teams">
                    <TournamentTeams 
                        tournament={tournament}
                        updateTournament={updateTournament}
                    />
                </TabsContent>

                <TabsContent value="schedule">
                    <TournamentSchedule 
                        tournament={tournament}
                        updateTournament={updateTournament}
                    />
                </TabsContent>

                <TabsContent value="announcements">
                    <TournamentAnnouncements 
                        tournament={tournament}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
} 