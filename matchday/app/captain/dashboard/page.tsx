"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStatus } from "@/src/hooks/useAuthStatus"
import { UserRole } from "@/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trophy, Users, Calendar, MapPin, ArrowRight, Activity, Plus } from "lucide-react"
import { format } from "date-fns"

interface Team {
    id: string
    name: string
    players: Array<{
        name: string
        position?: string
        number?: number
    }>
    tournamentId?: string
    tournamentName?: string
}

interface Tournament {
    id: string
    name: string
    startDate: string
    endDate: string
    location: string
    status: string
    teamCount: number
    maxTeams: number
}

export default function CaptainDashboard() {
    const router = useRouter()
    const { user, loading } = useAuthStatus()
    const [teams, setTeams] = useState<Team[]>([])
    const [tournaments, setTournaments] = useState<Tournament[]>([])
    const [stats, setStats] = useState({
        totalTeams: 0,
        activeTournaments: 0,
        upcomingMatches: 0
    })

    useEffect(() => {
        if (!loading && (!user || user.role !== UserRole.CAPTAIN)) {
            router.push('/login')
        }
    }, [user, loading, router])

    if (loading) {
        return (
            <div className="container flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (!user || user.role !== UserRole.CAPTAIN) {
        return null
    }

    return (
        <div className="container py-10">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Captain Dashboard</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Welcome back, {user.username}</p>
                </div>
                <Button onClick={() => router.push('/captain/teams/create')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Team
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-3 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">My Teams</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{teams.length}</div>
                        <p className="text-xs text-muted-foreground">
                            Teams you manage
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Tournaments</CardTitle>
                        <Trophy className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeTournaments}</div>
                        <p className="text-xs text-muted-foreground">
                            Tournaments you're participating in
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Upcoming Matches</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.upcomingMatches}</div>
                        <p className="text-xs text-muted-foreground">
                            Matches scheduled for today
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Teams</h2>
                        <Button variant="outline" onClick={() => router.push('/captain/teams')}>
                            View All Teams
                        </Button>
                    </div>

                    <div className="grid gap-6">
                        {teams.length === 0 ? (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center py-10">
                                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-medium mb-2">No Teams Yet</h3>
                                    <p className="text-sm text-muted-foreground text-center mb-4">
                                        Create your first team to start participating in tournaments.
                                    </p>
                                    <Button onClick={() => router.push('/captain/teams/create')}>
                                        Create Team
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            teams.map((team) => (
                                <Card key={team.id} className="hover:shadow-lg transition-shadow">
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle>{team.name}</CardTitle>
                                                <CardDescription>
                                                    {team.players.length} players
                                                </CardDescription>
                                            </div>
                                            {team.tournamentId && (
                                                <Badge variant="secondary">
                                                    {team.tournamentName}
                                                </Badge>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex justify-end">
                                            <Button variant="outline" onClick={() => router.push(`/captain/teams/${team.id}`)}>
                                                Manage Team
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Available Tournaments</h2>
                        <Button variant="outline" onClick={() => router.push('/tournaments')}>
                            View All Tournaments
                        </Button>
                    </div>

                    <div className="grid gap-6">
                        {tournaments.length === 0 ? (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center py-10">
                                    <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-medium mb-2">No Tournaments Available</h3>
                                    <p className="text-sm text-muted-foreground text-center mb-4">
                                        Check back later for new tournaments.
                                    </p>
                                    <Button onClick={() => router.push('/tournaments')}>
                                        Browse Tournaments
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            tournaments.map((tournament) => (
                                <Card key={tournament.id} className="hover:shadow-lg transition-shadow">
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle>{tournament.name}</CardTitle>
                                                <CardDescription>
                                                    {tournament.teamCount}/{tournament.maxTeams} teams registered
                                                </CardDescription>
                                            </div>
                                            <Badge variant={tournament.status === 'active' ? 'default' : 'secondary'}>
                                                {tournament.status}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm">
                                                    {format(new Date(tournament.startDate), 'MMM dd, yyyy')} - {format(new Date(tournament.endDate), 'MMM dd, yyyy')}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm">{tournament.location}</span>
                                            </div>
                                        </div>
                                        <div className="mt-4 flex justify-end">
                                            <Button variant="outline" onClick={() => router.push(`/tournaments/${tournament.id}`)}>
                                                View Details
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
} 