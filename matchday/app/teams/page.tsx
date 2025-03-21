"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users } from "lucide-react"

interface Team {
    id: string
    name: string
    captain: {
        name: string
        email: string
    }
    status: string
    tournamentId: string
    tournamentName?: string
    players: Array<{
        name: string
        position?: string
        number?: number
    }>
}

// Mock data for development
const mockTeams: Team[] = [
    {
        id: "1",
        name: "Thunderbolts FC",
        captain: {
            name: "John Smith",
            email: "john@example.com"
        },
        status: "approved",
        tournamentId: "t1",
        tournamentName: "Summer Football Cup 2024",
        players: [
            { name: "John Smith", position: "Forward", number: 10 },
            { name: "Mike Johnson", position: "Midfielder", number: 8 },
            { name: "David Brown", position: "Defender", number: 4 }
        ]
    },
    {
        id: "2",
        name: "Phoenix Rising",
        captain: {
            name: "Sarah Johnson",
            email: "sarah@example.com"
        },
        status: "approved",
        tournamentId: "t2",
        tournamentName: "City Championship 2024",
        players: [
            { name: "Sarah Johnson", position: "Midfielder", number: 6 },
            { name: "Emma Wilson", position: "Forward", number: 9 },
            { name: "Lisa Chen", position: "Defender", number: 3 }
        ]
    },
    {
        id: "3",
        name: "Royal Eagles",
        captain: {
            name: "Michael Brown",
            email: "michael@example.com"
        },
        status: "approved",
        tournamentId: "t1",
        tournamentName: "Summer Football Cup 2024",
        players: [
            { name: "Michael Brown", position: "Goalkeeper", number: 1 },
            { name: "James Wilson", position: "Defender", number: 5 },
            { name: "Alex Turner", position: "Forward", number: 11 }
        ]
    }
]

export default function TeamsPage() {
    const [teams, setTeams] = useState<Team[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Simulate API call with mock data
        const fetchTeams = async () => {
            try {
                // Simulate network delay
                await new Promise(resolve => setTimeout(resolve, 1000))
                setTeams(mockTeams)
            } catch (error) {
                console.error("Error fetching teams:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchTeams()
    }, [])

    return (
        <div className="container py-10">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold">Teams</h1>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {teams.map((team) => (
                        <Card key={team.id}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    {team.name}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div>
                                        <div className="text-sm font-medium text-muted-foreground">Captain</div>
                                        <div>{team.captain.name}</div>
                                        <div className="text-sm text-muted-foreground">{team.captain.email}</div>
                                    </div>

                                    <div>
                                        <div className="text-sm font-medium text-muted-foreground">Tournament</div>
                                        <div>{team.tournamentName}</div>
                                    </div>

                                    <div>
                                        <div className="text-sm font-medium text-muted-foreground">Players</div>
                                        <div className="mt-1">
                                            {team.players.map((player, index) => (
                                                <div key={index} className="text-sm">
                                                    {player.name}
                                                    {player.position && ` - ${player.position}`}
                                                    {player.number && ` (#${player.number})`}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <Badge className="bg-green-100 text-green-800">
                                            Approved
                                        </Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
} 