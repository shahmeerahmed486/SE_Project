"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStatus } from "@/src/hooks/useAuthStatus"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Tournament, User, UserRole } from "@/types"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { AuthService } from "@/src/api/services/AuthService"

export default function AdminDashboard() {
  const { user, loading } = useAuthStatus()
  const router = useRouter()
  const { toast } = useToast()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [managementUsers, setManagementUsers] = useState<User[]>([])

  // New management user form state
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    username: "",
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

  // Check authentication and role
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login')
        return
      }

      if (user.role !== UserRole.ADMIN) {
        toast({
          title: "Unauthorized",
          description: "You must be an admin to access this page",
          variant: "destructive"
        })
        router.push('/')
        return
      }
    }
  }, [user, loading, router, toast])

  useEffect(() => {
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
      await AuthService.createManagementUser({
        email: newUser.email,
        password: newUser.password,
        username: newUser.username
      })

      toast({
        title: "Success",
        description: "Management team user created successfully"
      })

      // Reset form
      setNewUser({
        email: "",
        password: "",
        username: "",
        assignedTournaments: []
      })

      // Refresh management users list
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
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user || user.role !== UserRole.ADMIN) {
    return null
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
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="username">Full Name</Label>
                  <Input
                    id="username"
                    value={newUser.username}
                    onChange={(e) => setNewUser({
                      ...newUser,
                      username: e.target.value
                    })}
                    required
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
                    required
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
                  <CardTitle>{managementUser.username}</CardTitle>
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

