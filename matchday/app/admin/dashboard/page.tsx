"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Users, Bell, LogOut, Plus } from "lucide-react"

interface TeamRegistration {
  id: string
  teamName: string
  captain: {
    name: string
    email: string
  }
  status: string
  createdAt: any
}

interface Tournament {
  id: string
  name: string
  format: string
  status: string
  teamCount: number
  maxTeams: number
}

export default function AdminDashboard() {
  const [registrations, setRegistrations] = useState<TeamRegistration[]>([])
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    // Handle authentication state
    try {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        if (currentUser) {
          setUser(currentUser)
        } else {
          // If in development or demo mode, create a mock user
          if (process.env.NODE_ENV === "development" || !process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
            setUser({ uid: "demo-user-id", email: "demo@example.com" })
          } else {
            router.push("/login")
          }
        }
      })

      return () => {
        if (typeof unsubscribe === "function") {
          unsubscribe()
        }
      }
    } catch (error) {
      console.error("Auth state error:", error)
      // For demo purposes, create a mock user
      setUser({ uid: "demo-user-id", email: "demo@example.com" })
    }
  }, [router])

  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      try {
        // For demo purposes, use sample data
        const sampleRegistrations: TeamRegistration[] = [
          {
            id: "1",
            teamName: "Thunderbolts FC",
            captain: {
              name: "John Smith",
              email: "john@example.com",
            },
            status: "pending",
            createdAt: new Date(),
          },
          {
            id: "2",
            teamName: "Phoenix Rising",
            captain: {
              name: "Sarah Johnson",
              email: "sarah@example.com",
            },
            status: "approved",
            createdAt: new Date(Date.now() - 86400000),
          },
          {
            id: "3",
            teamName: "Royal Eagles",
            captain: {
              name: "Michael Brown",
              email: "michael@example.com",
            },
            status: "rejected",
            createdAt: new Date(Date.now() - 172800000),
          },
        ]

        const sampleTournaments: Tournament[] = [
          {
            id: "1",
            name: "Summer Football Cup 2023",
            format: "League + Knockout",
            status: "active",
            teamCount: 12,
            maxTeams: 16,
          },
          {
            id: "2",
            name: "Basketball Championship",
            format: "Round Robin",
            status: "active",
            teamCount: 8,
            maxTeams: 8,
          },
          {
            id: "3",
            name: "Volleyball Tournament",
            format: "Knockout",
            status: "upcoming",
            teamCount: 0,
            maxTeams: 16,
          },
        ]

        setRegistrations(sampleRegistrations)
        setTournaments(sampleTournaments)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  const handleLogout = async () => {
    try {
      if (typeof auth.signOut === "function") {
        await auth.signOut()
      }
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  if (!user) {
    return (
      <div className="container flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Matchday</span>
            <span className="ml-2 text-sm text-muted-foreground">Admin Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            {process.env.NODE_ENV === "development" && (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Demo Mode</span>
            )}
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
              <span className="sr-only">Logout</span>
            </Button>
          </div>
        </div>
      </header>
      <div className="container flex-1 py-6">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <div className="flex gap-2">
              <Link href="/admin/tournaments/create">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Tournament
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Tournaments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Trophy className="h-5 w-5 text-primary" />
                  <div className="text-2xl font-bold">{tournaments.length}</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Team Registrations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Users className="h-5 w-5 text-primary" />
                  <div className="text-2xl font-bold">{registrations.length}</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Bell className="h-5 w-5 text-primary" />
                  <div className="text-2xl font-bold">
                    {registrations.filter((reg) => reg.status === "pending").length}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="tournaments">
            <TabsList>
              <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
              <TabsTrigger value="registrations">Team Registrations</TabsTrigger>
            </TabsList>
            <TabsContent value="tournaments" className="space-y-4">
              <div className="rounded-md border">
                <div className="grid grid-cols-5 border-b px-4 py-3 font-medium">
                  <div className="col-span-2">Name</div>
                  <div>Format</div>
                  <div>Teams</div>
                  <div>Status</div>
                </div>
                <div className="divide-y">
                  {tournaments.map((tournament) => (
                    <div key={tournament.id} className="grid grid-cols-5 items-center px-4 py-3">
                      <div className="col-span-2 font-medium">{tournament.name}</div>
                      <div>{tournament.format}</div>
                      <div>
                        {tournament.teamCount} / {tournament.maxTeams}
                      </div>
                      <div>
                        <div
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            tournament.status === "active"
                              ? "bg-green-100 text-green-800"
                              : tournament.status === "upcoming"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {tournament.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end">
                <Link href="/admin/tournaments">
                  <Button variant="outline">View All Tournaments</Button>
                </Link>
              </div>
            </TabsContent>
            <TabsContent value="registrations" className="space-y-4">
              <div className="rounded-md border">
                <div className="grid grid-cols-4 border-b px-4 py-3 font-medium">
                  <div className="col-span-2">Team</div>
                  <div>Captain</div>
                  <div>Status</div>
                </div>
                <div className="divide-y">
                  {registrations.map((registration) => (
                    <div key={registration.id} className="grid grid-cols-4 items-center px-4 py-3">
                      <div className="col-span-2 font-medium">{registration.teamName}</div>
                      <div className="text-sm">
                        <div>{registration.captain.name}</div>
                        <div className="text-muted-foreground">{registration.captain.email}</div>
                      </div>
                      <div>
                        <div
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            registration.status === "approved"
                              ? "bg-green-100 text-green-800"
                              : registration.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {registration.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end">
                <Link href="/admin/registrations">
                  <Button variant="outline">View All Registrations</Button>
                </Link>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

