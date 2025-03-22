"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/src/firebase/config";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Calendar, Users, MapPin } from "lucide-react";

interface Tournament {
    id: string;
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    location: string;
    format: string;
    status: string;
    teamCount: number;
    maxTeams: number;
}

interface TournamentGridProps {
    searchQuery: string;
    statusFilter: string;
    formatFilter: string;
}

export default function TournamentGrid({ searchQuery, statusFilter, formatFilter }: TournamentGridProps) {
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTournaments = async () => {
            try {
                let q = query(collection(db, "tournaments"));

                // Apply filters
                if (statusFilter !== "all") {
                    q = query(q, where("status", "==", statusFilter));
                }
                if (formatFilter !== "all") {
                    q = query(q, where("format", "==", formatFilter));
                }

                const querySnapshot = await getDocs(q);
                const tournamentsData: Tournament[] = [];

                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    tournamentsData.push({
                        id: doc.id,
                        name: data.name,
                        description: data.description,
                        startDate: data.startDate,
                        endDate: data.endDate,
                        location: data.location,
                        format: data.format,
                        status: data.status,
                        teamCount: data.teamCount || 0,
                        maxTeams: data.maxTeams,
                    });
                });

                // Apply search filter client-side
                const filteredTournaments = searchQuery
                    ? tournamentsData.filter((tournament) =>
                        tournament.name.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    : tournamentsData;

                setTournaments(filteredTournaments);
            } catch (error) {
                console.error("Error fetching tournaments:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTournaments();
    }, [searchQuery, statusFilter, formatFilter]);

    if (loading) {
        return (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                    <div
                        key={i}
                        className="h-[300px] rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse"
                    />
                ))}
            </div>
        );
    }

    if (tournaments.length === 0) {
        return (
            <div className="text-center py-12">
                <Trophy className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-semibold">No tournaments found</h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Try adjusting your search or filters
                </p>
            </div>
        );
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tournaments.map((tournament) => (
                <Card key={tournament.id} className="flex flex-col">
                    <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-semibold mb-1">{tournament.name}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {tournament.description}
                                </p>
                            </div>
                            <Badge
                                variant={
                                    tournament.status === "upcoming"
                                        ? "default"
                                        : tournament.status === "ongoing"
                                            ? "outline"
                                            : "secondary"
                                }
                            >
                                {tournament.status}
                            </Badge>
                        </div>
                        <div className="space-y-3 mb-6">
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <Calendar className="h-4 w-4" />
                                <span>
                                    {new Date(tournament.startDate).toLocaleDateString()} -{" "}
                                    {new Date(tournament.endDate).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <MapPin className="h-4 w-4" />
                                <span>{tournament.location}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <Users className="h-4 w-4" />
                                <span>
                                    {tournament.teamCount} / {tournament.maxTeams} teams
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-auto p-6 pt-0">
                        <Link href={`/tournaments/${tournament.id}`} className="block w-full">
                            <Button variant="outline" className="w-full">
                                View Details
                            </Button>
                        </Link>
                    </div>
                </Card>
            ))}
        </div>
    );
} 