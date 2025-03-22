"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, MapPin, ArrowLeft, Trophy, Info, Shield, Award, Clock } from "lucide-react"
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
import { format } from "date-fns"

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
  registrationStatus: string
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
  date: string
  time: string
  location: string
  status: string
  scoreA?: number
  scoreB?: number
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

  return (
    <div className="container py-10">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/tournaments" className="flex items-center gap-2 text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Tournaments</span>
        </Link>
        <div className="h-4 w-px bg-border" />
        <Badge variant={tournament.status === 'active' ? 'default' : 'secondary'}>
          {tournament.status}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Date</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>
              {format(new Date(tournament.startDate), 'MMM dd, yyyy')} - {format(new Date(tournament.endDate), 'MMM dd, yyyy')}
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

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>About Tournament</CardTitle>
              <CardDescription>{tournament.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Format: {tournament.format}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Registration: {tournament.registrationStatus}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tournament Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {tournament.rules.map((rule, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span className="text-sm">{rule}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Prizes</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {tournament.prizes.map((prize, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Award className="h-4 w-4 text-primary mt-0.5" />
                    <span className="text-sm">{prize}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Registration</CardTitle>
            </CardHeader>
            <CardContent>
              {tournament.registrationStatus === 'open' ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Spots remaining: {tournament.maxTeams - tournament.teamCount}</span>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => setShowRegistrationForm(true)}
                    disabled={tournament.teamCount >= tournament.maxTeams}
                  >
                    Register Your Team
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                  <Info className="h-4 w-4" />
                  <span>Registration is currently closed for this tournament.</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="matches" className="space-y-4">
            <TabsList className="w-full">
              <TabsTrigger value="matches" className="flex-1">Matches</TabsTrigger>
              <TabsTrigger value="teams" className="flex-1">Teams</TabsTrigger>
            </TabsList>

            <TabsContent value="matches" className="space-y-4">
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
                          {format(new Date(match.date), 'MMM dd, yyyy')} at {match.time}
                        </div>
                        <div>{match.location}</div>
                        <div>
                          <Badge variant="secondary">Upcoming</Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

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
                        <div>{format(new Date(match.date), 'MMM dd, yyyy')}</div>
                        <div>{match.location}</div>
                      </div>
                    ))}
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

