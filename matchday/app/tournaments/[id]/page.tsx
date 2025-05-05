"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, MapPin, ArrowLeft, Trophy, Clock } from "lucide-react"
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
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
import { useAuth } from '@/src/hooks/useAuth'
import { toast } from "@/components/ui/use-toast"
import { TeamService } from '@/src/services/team/TeamService'
import Cookies from 'js-cookie'

import { UserRole, TournamentStatus, Tournament, Match, Team, Announcement } from '@/src/types'

export default function TournamentDetailsPage() {
  const params = useParams()
  const tournamentId = params?.id as string
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [showRegistrationForm, setShowRegistrationForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user, loading: authLoading } = useAuth()
  const [hasRegisteredTeam, setHasRegisteredTeam] = useState(false)

  useEffect(() => {
    // Debug log to check user role
    console.log('Auth loading:', authLoading)
    console.log('Current user:', user)
    console.log('User role:', user?.role)
    console.log('Token:', Cookies.get('token'))
  }, [user, authLoading])

  useEffect(() => {
    const fetchData = async () => {
      if (!tournamentId) return
      setLoading(true)

      try {
        // Fetch tournament details
        const tournamentDoc = await getDoc(doc(db, 'tournaments', tournamentId))
        if (tournamentDoc.exists()) {
          setTournament({ id: tournamentDoc.id, ...tournamentDoc.data() } as Tournament)
        }

        // Fetch teams
        const teamsData = await TeamService.getTeamsByTournament(tournamentId)
        setTeams(teamsData)

        // Fetch matches
        const matchesQuery = query(
          collection(db, "matches"),
          where("tournamentId", "==", tournamentId)
        )
        const matchesSnapshot = await getDocs(matchesQuery)
        const fetchedMatches: Match[] = matchesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Match))
        setMatches(fetchedMatches)

        // Fetch announcements
        const q = query(
          collection(db, "announcements"),
          where("tournamentId", "==", tournamentId)
        )
        const querySnapshot = await getDocs(q)
        const fetchedAnnouncements: Announcement[] = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Announcement))
        setAnnouncements(fetchedAnnouncements)

        // Check if current user (captain) already has a team
        if (user?.role === "CAPTAIN") {
          const hasTeam = teamsData.some(team => team.captainId === user.id)
          setHasRegisteredTeam(hasTeam)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        toast({
          title: "Error",
          description: "Failed to load tournament details",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    // Only fetch when auth is done loading
    if (!authLoading) {
      fetchData()
    }
  }, [tournamentId, user, authLoading])

  const handleRegistration = async (data: {
    teamName: string;
    players: {
      name: string;
      position: string;
      number: string;
    }[];
  }) => {
    try {
      if (!user || user.role !== "CAPTAIN") {
        toast({
          title: "Unauthorized",
          description: "Only team captains can register teams",
          variant: "destructive",
        })
        return
      }

      const teamData: Omit<Team, 'id'> = {
        name: data.teamName,
        tournamentId,
        captainId: user.id,
        players: data.players,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        eliminated: false, // Initialize as not eliminated
        status: 'pending' // Set initial status for team approval
      }

      await TeamService.createTeam(teamData)

      toast({
        title: "Success",
        description: "Team registered successfully!",
      })

      setShowRegistrationForm(false)
      // Refresh teams list
      const updatedTeams = await TeamService.getTeamsByTournament(tournamentId)
      setTeams(updatedTeams)
    } catch (error: any) {
      console.error('Error registering team:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to register team",
        variant: "destructive",
      })
    }
  }

  // Helper function to safely format a date string (from TournamentManagement)
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'Unknown Date'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) throw new Error('Invalid date')
      return format(date, 'MMM dd, yyyy')
    } catch {
      console.warn(`Invalid date string: ${dateString}`)
      return 'Invalid Date'
    }
  }

  if (loading || authLoading) {
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
        <Badge variant={tournament.status === TournamentStatus.REGISTRATION_OPEN ? 'default' : 'secondary'}>
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
              <CardTitle>Announcements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {announcements.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    No announcements yet
                  </div>
                ) : (
                  announcements.map((announcement) => (
                    <Card key={announcement.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{announcement.title}</CardTitle>
                            <CardDescription>
                              {formatDate(announcement.createdAt)}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p>{announcement.message}</p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Registration</CardTitle>
            </CardHeader>
            <CardContent>
              {tournament?.status === TournamentStatus.REGISTRATION_OPEN ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Spots remaining: {tournament.maxTeams - tournament.teamCount}</span>
                  </div>
                  {user && user.role === "CAPTAIN" ? (
                    hasRegisteredTeam ? (
                      <div className="text-sm text-muted-foreground">
                        You already have a team registered in this tournament.
                      </div>
                    ) : (
                      <Dialog open={showRegistrationForm} onOpenChange={setShowRegistrationForm}>
                        <DialogTrigger asChild>
                          <Button className="w-full">
                            Register Team
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Register Your Team</DialogTitle>
                            <DialogDescription>
                              Fill in the details to register your team for this tournament.
                            </DialogDescription>
                          </DialogHeader>
                          <TeamRegistrationForm
                            tournamentId={tournamentId}
                            maxPlayers={11}
                            minPlayers={5}
                            onClose={() => setShowRegistrationForm(false)}
                            onSubmit={handleRegistration}
                          />
                        </DialogContent>
                      </Dialog>
                    )
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      {!user ? "Please sign in to register your team." : "Only team captains can register teams."}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Registration is currently closed.
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
                  {loading ? (
                    <div className="px-4 py-3 text-center text-muted-foreground">
                      Loading matches...
                    </div>
                  ) : matches.filter((match) => match.status === "SCHEDULED").length === 0 ? (
                    <div className="px-4 py-3 text-center text-muted-foreground">
                      No upcoming matches scheduled
                    </div>
                  ) : (
                    matches
                      .filter((match) => match.status === "SCHEDULED")
                      .map((match) => {
                        const teamA = teams.find(t => t.id === match.teamA)
                        const teamB = teams.find(t => t.id === match.teamB)
                        return (
                          <div key={match.id} className="grid grid-cols-5 items-center px-4 py-3">
                            <div className="col-span-2 font-medium">
                              {teamA?.name || 'TBD'} vs {teamB?.name || 'TBD'}
                            </div>
                            <div>
                              {format(new Date(match.date), 'MMM dd, yyyy')} at {match.time}
                            </div>
                            <div>{match.location}</div>
                            <div>
                              <Badge variant="secondary">Upcoming</Badge>
                            </div>
                          </div>
                        )
                      })
                  )}
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
                  {loading ? (
                    <div className="px-4 py-3 text-center text-muted-foreground">
                      Loading matches...
                    </div>
                  ) : matches.filter((match) => match.status === "COMPLETED").length === 0 ? (
                    <div className="px-4 py-3 text-center text-muted-foreground">
                      No completed matches
                    </div>
                  ) : (
                    matches
                      .filter((match) => match.status === "COMPLETED")
                      .map((match) => {
                        const teamA = teams.find(t => t.id === match.teamA)
                        const teamB = teams.find(t => t.id === match.teamB)
                        return (
                          <div key={match.id} className="grid grid-cols-5 items-center px-4 py-3">
                            <div className="col-span-2 font-medium">
                              {teamA?.name || 'TBD'} vs {teamB?.name || 'TBD'}
                            </div>
                            <div className="font-bold">
                              {match.scoreA} - {match.scoreB}
                            </div>
                            <div>{format(new Date(match.date), 'MMM dd, yyyy')}</div>
                            <div>{match.location}</div>
                          </div>
                        )
                      })
                  )}
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
                      <div>{user?.id === team.captainId ? 'You' : 'Captain'}</div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
