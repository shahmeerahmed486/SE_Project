"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, MapPin, ArrowLeft, Trophy, Info, Shield, Award } from "lucide-react"
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/src/firebase/config'
import TeamRegistrationForm from '@/components/tournament/TeamRegistrationForm'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

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
  rules: string[]
  prizes: string[]
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
  const [showRegistrationForm, setShowRegistrationForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTournamentData = async () => {
      if (!tournamentId) return

      try {
        const tournamentDoc = await getDoc(doc(db, 'tournaments', tournamentId))
        if (tournamentDoc.exists()) {
          setTournament({ id: tournamentDoc.id, ...tournamentDoc.data() } as Tournament)
        } else {
          setError('Tournament not found')
        }
      } catch (error) {
        console.error('Error fetching tournament:', error)
        setError('Failed to load tournament details')
      } finally {
        setLoading(false)
      }
    }

    fetchTournamentData()
  }, [tournamentId])

  const handleRegistration = async (data: any) => {
    // Implement team registration logic here
    console.log('Registration data:', data)
  }

  if (loading) {
    return (
      <div className="container flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !tournament) {
    return (
      <div className="container py-10 text-center">
        <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
          {error || 'Tournament not found'}
        </h1>
        <Link href="/tournaments">
          <Button>Back to Tournaments</Button>
        </Link>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }
    return new Date(dateString).toLocaleDateString('en-US', options)
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
                {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
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
                {tournament.teamsRegistered} / {tournament.maxTeams}
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

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
          <h2 className="text-xl font-semibold mb-4">Registration</h2>
          {tournament.registrationStatus === 'open' ? (
            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Spots remaining: {tournament.maxTeams - tournament.teamsRegistered}
              </p>
              <Button
                className="w-full"
                onClick={() => setShowRegistrationForm(true)}
                disabled={tournament.teamsRegistered >= tournament.maxTeams}
              >
                Register Your Team
              </Button>
            </div>
          ) : (
            <p className="text-red-600 dark:text-red-400">
              Registration is currently closed for this tournament.
            </p>
          )}
        </div>
      </div>

      {showRegistrationForm && (
        <TeamRegistrationForm
          tournamentId={tournament.id}
          maxPlayers={20}
          minPlayers={11}
          onClose={() => setShowRegistrationForm(false)}
          onSubmit={handleRegistration}
        />
      )}
    </div>
  )
}

