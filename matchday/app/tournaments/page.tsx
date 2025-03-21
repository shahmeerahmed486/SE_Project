"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Calendar, Users, MapPin } from "lucide-react"

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

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        // Get active tournaments
        const q = query(collection(db, "tournaments"), where("status", "==", "active"))

        const querySnapshot = await getDocs(q)
        const tournamentsData: Tournament[] = []

        querySnapshot.forEach((doc) => {
          const data = doc.data()
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
          })
        })

        setTournaments(tournamentsData)
      } catch (error) {
        console.error("Error fetching tournaments:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTournaments()
  }, [])

  // For demo purposes, add some sample tournaments if none exist
  useEffect(() => {
    if (!loading && tournaments.length === 0) {
      const sampleTournaments: Tournament[] = [
        {
          id: "1",
          name: "Summer Football Cup 2023",
          description: "Annual summer football tournament for local teams",
          startDate: "2023-07-15",
          endDate: "2023-08-20",
          location: "City Sports Complex",
          format: "League + Knockout",
          status: "active",
          teamCount: 12,
          maxTeams: 16,
        },
        {
          id: "2",
          name: "Basketball Championship",
          description: "Regional basketball championship for amateur teams",
          startDate: "2023-09-05",
          endDate: "2023-10-15",
          location: "Downtown Arena",
          format: "Round Robin",
          status: "active",
          teamCount: 8,
          maxTeams: 8,
        },
        {
          id: "3",
          name: "Volleyball Tournament",
          description: "Beach volleyball tournament open for all skill levels",
          startDate: "2023-08-01",
          endDate: "2023-08-10",
          location: "Seaside Beach",
          format: "Knockout",
          status: "active",
          teamCount: 10,
          maxTeams: 16,
        },
      ]

      setTournaments(sampleTournaments)
    }
  }, [loading, tournaments])

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <Trophy className="h-6 w-6" />
            <span className="font-bold">Matchday</span>
          </Link>
          <span className="mx-2">|</span>
          <h1 className="text-2xl font-bold">Tournaments</h1>
        </div>
        <Link href="/register">
          <Button>Register Your Team</Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((tournament) => (
            <Card key={tournament.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle>{tournament.name}</CardTitle>
                  <Badge>{tournament.format}</Badge>
                </div>
                <CardDescription>{tournament.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {new Date(tournament.startDate).toLocaleDateString()} -{" "}
                    {new Date(tournament.endDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{tournament.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {tournament.teamCount} / {tournament.maxTeams} teams
                  </span>
                </div>
              </CardContent>
              <CardFooter>
                <Link href={`/tournaments/${tournament.id}`} className="w-full">
                  <Button variant="outline" className="w-full">
                    View Details
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

