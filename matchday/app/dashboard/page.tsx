"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStatus } from "@/src/hooks/useAuthStatus"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Tournament, Team, UserRole } from "@/src/types"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Trophy, Users, Calendar, MapPin } from "lucide-react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"

export default function Dashboard() {
    const { user, loading } = useAuthStatus()
    const router = useRouter()
    const { toast } = useToast()
    const [activeTeams, setActiveTeams] = useState<Team[]>([])
    const [participatingTournaments, setParticipatingTournaments] = useState<Tournament[]>([])

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return

            try {
                // Only fetch data if user is a captain
                if (user.role === UserRole.CAPTAIN) {
                    // Fetch captain's active teams
                    const teamsQuery = query(
                        collection(db, "teams"),
                        where("captainId", "==", user.id)
                    )
                    const teamsSnapshot = await getDocs(teamsQuery)
                    const teamsData = teamsSnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    })) as Team[]
                    setActiveTeams(teamsData)

                    // Fetch tournaments where captain's teams are participating
                    const tournamentIds = teamsData.map(team => team.tournamentId)
                    if (tournamentIds.length > 0) {
                        const tournamentsQuery = query(
                            collection(db, "tournaments"),
                            where("id", "in", tournamentIds)
                        )
                        const tournamentsSnapshot = await getDocs(tournamentsQuery)
                        const tournamentsData = tournamentsSnapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data(),
                            startDate: doc.data().startDate ? new Date(doc.data().startDate).toISOString() : null,
                            endDate: doc.data().endDate ? new Date(doc.data().endDate).toISOString() : null,
                            registrationDeadline: doc.data().registrationDeadline ? new Date(doc.data().registrationDeadline).toISOString() : null
                        })) as Tournament[]
                        setParticipatingTournaments(tournamentsData)
                    }
                }
            } catch (error) {
                console.error("Error fetching data:", error)
                toast({
                    title: "Error",
                    description: "Failed to load dashboard data",
                    variant: "destructive"
                })
            }
        }

        if (!loading) {
            fetchData()
        }
    }, [user, loading, toast])

    if (loading) {
        return <div>Loading...</div>
    }

    if (!user) {
        router.push('/login')
        return null
    }

    // If user is not a captain, redirect to appropriate dashboard
    if (user.role === UserRole.ADMIN) {
        router.push('/admin/dashboard')
        return null
    } else if (user.role === UserRole.MANAGEMENT) {
        router.push('/management/dashboard')
        return null
    }

    return (
        <div className="container py-10">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your teams and tournaments</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Your Teams</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeTeams.length}</div>
                        <p className="text-xs text-muted-foreground">
                            Active teams
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Tournaments</CardTitle>
                        <Trophy className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{participatingTournaments.length}</div>
                        <p className="text-xs text-muted-foreground">
                            Participating tournaments
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="teams" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="teams">Your Teams</TabsTrigger>
                    <TabsTrigger value="tournaments">Your Tournaments</TabsTrigger>
                </TabsList>

                <TabsContent value="teams" className="space-y-6">
                    <div className="grid gap-4">
                        {activeTeams.map((team) => (
                            <Card key={team.id}>
                                <CardHeader>
                                    <CardTitle>{team.name}</CardTitle>
                                    <CardDescription>
                                        {team.players.length} players registered
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex justify-end">
                                        <Button
                                            variant="outline"
                                            onClick={() => router.push(`/teams/${team.id}`)}
                                        >
                                            View Details
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="tournaments" className="space-y-6">
                    <div className="grid gap-4">
                        {participatingTournaments.map((tournament) => (
                            <Card key={tournament.id}>
                                <CardHeader>
                                    <CardTitle>{tournament.name}</CardTitle>
                                    <CardDescription>{tournament.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm">
                                                {tournament.startDate && tournament.endDate ? (
                                                    <>
                                                        {format(new Date(tournament.startDate), 'MMM dd, yyyy')} - {format(new Date(tournament.endDate), 'MMM dd, yyyy')}
                                                    </>
                                                ) : (
                                                    'Dates not set'
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm">{tournament.location}</span>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex justify-end">
                                        <Button
                                            variant="outline"
                                            onClick={() => router.push(`/tournaments/${tournament.id}`)}
                                        >
                                            View Details
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
} 