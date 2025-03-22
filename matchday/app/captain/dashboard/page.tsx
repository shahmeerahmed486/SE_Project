"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStatus } from "@/src/hooks/useAuthStatus"
import { UserRole } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function CaptainDashboard() {
    const router = useRouter()
    const { user, loading } = useAuthStatus()
    const [teams, setTeams] = useState([])
    const [tournaments, setTournaments] = useState([])

    useEffect(() => {
        if (!loading && (!user || user.role !== UserRole.CAPTAIN)) {
            router.push('/login')
        }
    }, [user, loading, router])

    if (loading) {
        return <div>Loading...</div>
    }

    if (!user || user.role !== UserRole.CAPTAIN) {
        return null
    }

    return (
        <div className="container py-10">
            <h1 className="text-3xl font-bold mb-8">Captain Dashboard</h1>
            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>My Teams</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {teams.length === 0 ? (
                                <div className="text-center">
                                    <p className="text-muted-foreground mb-4">You haven't created any teams yet.</p>
                                    <Button onClick={() => router.push('/captain/teams/create')}>
                                        Create Team
                                    </Button>
                                </div>
                            ) : (
                                teams.map((team: any) => (
                                    <div key={team.id} className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-medium">{team.name}</h3>
                                            <p className="text-sm text-muted-foreground">
                                                {team.players?.length || 0} players
                                            </p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            onClick={() => router.push(`/captain/teams/${team.id}`)}
                                        >
                                            Manage
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Tournaments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {tournaments.length === 0 ? (
                                <p className="text-muted-foreground">No tournaments available.</p>
                            ) : (
                                tournaments.map((tournament: any) => (
                                    <div key={tournament.id} className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-medium">{tournament.name}</h3>
                                            <p className="text-sm text-muted-foreground">
                                                {tournament.status}
                                            </p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            onClick={() => router.push(`/captain/tournaments/${tournament.id}`)}
                                        >
                                            View
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
} 