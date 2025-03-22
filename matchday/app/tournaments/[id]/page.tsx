"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, MapPin, ArrowLeft } from "lucide-react"

interface Tournament {
  id: string
  name: string
  description: string
  startDate: string
  endDate: string
  location: string
  format: string
  status: string
  teamCount: number
  maxTeams: number
}

interface Team {
  id: string
  name: string
  captainName: string
}

interface Match {
  id: string
  teamA: string
  teamB: string
  scoreA: number | null
  scoreB: number | null
  date: string
  time: string
  location: string
  status: string
}

export default function TournamentDetailsPage() {
  const params = useParams()
  const tournamentId = params?.id as string
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTournamentData = async () => {
      if (!tournamentId) return

      try {
        // For demo purposes, create sample data
        const sampleTournament: Tournament = {
          id: tournamentId,
          name: "Summer Football Cup 2023",
          description: "Annual summer football tournament for local teams",
          startDate: "2023-07-15",
          endDate: "2023-08-20",
          location: "City Sports Complex",
          format: "League + Knockout",
          status: "active",
          teamCount: 12,
          maxTeams: 16,
        }

        const sampleTeams: Team[] = [
          { id: "1", name: "Thunderbolts FC", captainName: "John Smith" },
          { id: "2", name: "Phoenix Rising", captainName: "Sarah Johnson" },
          { id: "3", name: "Royal Eagles", captainName: "Michael Brown" },
          { id: "4", name: "Dynamo United", captainName: "Emma Wilson" },
          { id: "5", name: "Spartans SC", captainName: "David Lee" },
          { id: "6", name: "Titans Athletic", captainName: "Jessica Taylor" },
        ]

        const sampleMatches: Match[] = [
          {
            id: "1",
            teamA: "Thunderbolts FC",
            teamB: "Phoenix Rising",
            scoreA: 2,
            scoreB: 1,
            date: "2023-07-15",
            time: "14:00",
            location: "Field A",
            status: "completed",
          },
          {
            id: "2",
            teamA: "Royal Eagles",
            teamB: "Dynamo United",
            scoreA: 0,
            scoreB: 0,
            date: "2023-07-15",
            time: "16:30",
            location: "Field B",
            status: "completed",
          },
          {
            id: "3",
            teamA: "Spartans SC",
            teamB: "Titans Athletic",
            scoreA: 3,
            scoreB: 2,
            date: "2023-07-16",
            time: "15:00",
            location: "Field A",
            status: "completed",
          },
          {
            id: "4",
            teamA: "Thunderbolts FC",
            teamB: "Royal Eagles",
            scoreA: null,
            scoreB: null,
            date: "2023-07-22",
            time: "14:00",
            location: "Field A",
            status: "scheduled",
          },
          {
            id: "5",
            teamA: "Phoenix Rising",
            teamB: "Spartans SC",
            scoreA: null,
            scoreB: null,
            date: "2023-07-22",
            time: "16:30",
            location: "Field B",
            status: "scheduled",
          },
        ]

        setTournament(sampleTournament)
        setTeams(sampleTeams)
        setMatches(sampleMatches)
      } catch (error) {
        console.error("Error fetching tournament data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTournamentData()
  }, [tournamentId])

  if (loading) {
    return (
      <div className="container flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!tournament) {
    return (
      <div className="container py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">Tournament not found</h1>
        <Link href="/tournaments">
          <Button>Back to Tournaments</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <div className="flex items-center gap-2 mb-8">
        <Link href="/tournaments" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Tournaments</span>
        </Link>
      </div>

      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{tournament.name}</h1>
            <p className="text-muted-foreground mt-1">{tournament.description}</p>
          </div>
          <Badge className="w-fit">{tournament.format}</Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Date</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {new Date(tournament.startDate).toLocaleDateString()} -{" "}
                {new Date(tournament.endDate).toLocaleDateString()}
              </span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Location</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{tournament.location}</span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Teams</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>
                {tournament.teamCount} / {tournament.maxTeams}
              </span>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="matches">
          <TabsList>
            <TabsTrigger value="matches">Matches</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
          </TabsList>
          <TabsContent value="matches" className="space-y-4">
            <div className="grid gap-4">
              <h2 className="text-xl font-bold">Upcoming Matches</h2>
              <div className="rounded-md border">
                <div className="grid grid-cols-5 border-b px-4 py-3 font-medium">
                  <div className="col-span-2">Teams</div>
                  <div>Date & Time</div>
                  <div>Location</div>
                  <div>Status</div>
                </div>
                <div className="divide-y">
                  {matches
                    .filter((match) => match.status === "scheduled")
                    .map((match) => (
                      <div key={match.id} className="grid grid-cols-5 items-center px-4 py-3">
                        <div className="col-span-2 font-medium">
                          {match.teamA} vs {match.teamB}
                        </div>
                        <div>
                          {new Date(match.date).toLocaleDateString()} at {match.time}
                        </div>
                        <div>{match.location}</div>
                        <div>
                          <div className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                            Upcoming
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <h2 className="text-xl font-bold mt-6">Completed Matches</h2>
              <div className="rounded-md border">
                <div className="grid grid-cols-5 border-b px-4 py-3 font-medium">
                  <div className="col-span-2">Teams</div>
                  <div>Result</div>
                  <div>Date</div>
                  <div>Location</div>
                </div>
                <div className="divide-y">
                  {matches
                    .filter((match) => match.status === "completed")
                    .map((match) => (
                      <div key={match.id} className="grid grid-cols-5 items-center px-4 py-3">
                        <div className="col-span-2 font-medium">
                          {match.teamA} vs {match.teamB}
                        </div>
                        <div className="font-bold">
                          {match.scoreA} - {match.scoreB}
                        </div>
                        <div>{new Date(match.date).toLocaleDateString()}</div>
                        <div>{match.location}</div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="teams" className="space-y-4">
            <div className="rounded-md border">
              <div className="grid grid-cols-3 border-b px-4 py-3 font-medium">
                <div className="col-span-2">Team Name</div>
                <div>Captain</div>
              </div>
              <div className="divide-y">
                {teams.map((team) => (
                  <div key={team.id} className="grid grid-cols-3 items-center px-4 py-3">
                    <div className="col-span-2 font-medium">{team.name}</div>
                    <div>{team.captainName}</div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

