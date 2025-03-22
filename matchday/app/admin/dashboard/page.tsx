"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/src/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Tournament, User, UserRole } from "@/types"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function AdminDashboard() {
  const { user, loading, createManagementUser } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [managementUsers, setManagementUsers] = useState<User[]>([])

  // New management user form state
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    name: "",
    assignedTournaments: [] as string[]
  })

  // New tournament form state
  const [newTournament, setNewTournament] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    location: "",
    format: "KNOCKOUT",
    maxTeams: 16
  })

  useEffect(() => {
    if (!loading && (!user || user.role !== UserRole.ADMIN)) {
      router.push("/login")
      return
    }

    const fetchData = async () => {
      try {
        // Fetch tournaments
        const tournamentsSnapshot = await getDocs(collection(db, "tournaments"))
        const tournamentsData = tournamentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Tournament[]
        setTournaments(tournamentsData)

        // Fetch management users
        const managementUsersQuery = query(
          collection(db, "users"),
          where("role", "==", UserRole.MANAGEMENT)
        )
        const managementUsersSnapshot = await getDocs(managementUsersQuery)
        const managementUsersData = managementUsersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as User[]
        setManagementUsers(managementUsersData)
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive"
        })
      }
    }

    fetchData()
  }, [user, loading, router, toast])

  const handleCreateManagementUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createManagementUser(
        newUser.email,
        newUser.password,
        newUser.name,
        newUser.assignedTournaments
      )
      toast({
        title: "Success",
        description: "Management team user created successfully"
      })
      setNewUser({
        email: "",
        password: "",
        name: "",
        assignedTournaments: []
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <Tabs defaultValue="tournaments">
        <TabsList>
          <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
          <TabsTrigger value="users">Management Users</TabsTrigger>
        </TabsList>

        <TabsContent value="tournaments">
          <Card>
            <CardHeader>
              <CardTitle>Create New Tournament</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div>
                  <Label htmlFor="name">Tournament Name</Label>
                  <Input
                    id="name"
                    value={newTournament.name}
                    onChange={(e) => setNewTournament({
                      ...newTournament,
                      name: e.target.value
                    })}
                  />
                </div>
                {/* Add other tournament form fields */}
                <Button type="submit">Create Tournament</Button>
              </form>
            </CardContent>
          </Card>

          <div className="mt-8 grid gap-6">
            <h2 className="text-xl font-bold">Active Tournaments</h2>
            {tournaments.map((tournament) => (
              <Card key={tournament.id}>
                <CardHeader>
                  <CardTitle>{tournament.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Add tournament details and management options */}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Create Management User</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateManagementUser} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({
                      ...newUser,
                      email: e.target.value
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={newUser.name}
                    onChange={(e) => setNewUser({
                      ...newUser,
                      name: e.target.value
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({
                      ...newUser,
                      password: e.target.value
                    })}
                  />
                </div>
                <Button type="submit">Create User</Button>
              </form>
            </CardContent>
          </Card>

          <div className="mt-8 grid gap-6">
            <h2 className="text-xl font-bold">Management Team Users</h2>
            {managementUsers.map((managementUser) => (
              <Card key={managementUser.id}>
                <CardHeader>
                  <CardTitle>{managementUser.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{managementUser.email}</p>
                  {/* Add user management options */}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

