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
import { collection, query, where, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Plus, Trash2, Edit2, Save, X } from "lucide-react"

export default function AdminDashboard() {
  const { user, loading, createManagementUser } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [managementUsers, setManagementUsers] = useState<User[]>([])
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null)
  const [editingRuleIndex, setEditingRuleIndex] = useState<number | null>(null)
  const [newRule, setNewRule] = useState("")
  const [editingRule, setEditingRule] = useState("")

  // New management user form state
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    name: "",
    assignedTournaments: [] as string[]
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

  const handleAddRule = async () => {
    if (!selectedTournament || !newRule.trim()) return

    try {
      const tournamentRef = doc(db, "tournaments", selectedTournament.id)
      const updatedRules = [...(selectedTournament.rules || []), newRule.trim()]
      
      await updateDoc(tournamentRef, {
        rules: updatedRules
      })

      setSelectedTournament({
        ...selectedTournament,
        rules: updatedRules
      })
      setNewRule("")
      toast({
        title: "Success",
        description: "Rule added successfully"
      })
    } catch (error) {
      console.error("Error adding rule:", error)
      toast({
        title: "Error",
        description: "Failed to add rule",
        variant: "destructive"
      })
    }
  }

  const handleUpdateRule = async (index: number) => {
    if (!selectedTournament || !editingRule.trim()) return

    try {
      const tournamentRef = doc(db, "tournaments", selectedTournament.id)
      const updatedRules = [...(selectedTournament.rules || [])]
      updatedRules[index] = editingRule.trim()
      
      await updateDoc(tournamentRef, {
        rules: updatedRules
      })

      setSelectedTournament({
        ...selectedTournament,
        rules: updatedRules
      })
      setEditingRuleIndex(null)
      setEditingRule("")
      toast({
        title: "Success",
        description: "Rule updated successfully"
      })
    } catch (error) {
      console.error("Error updating rule:", error)
      toast({
        title: "Error",
        description: "Failed to update rule",
        variant: "destructive"
      })
    }
  }

  const handleDeleteRule = async (index: number) => {
    if (!selectedTournament) return

    try {
      const tournamentRef = doc(db, "tournaments", selectedTournament.id)
      const updatedRules = (selectedTournament.rules || []).filter((_, i) => i !== index)
      
      await updateDoc(tournamentRef, {
        rules: updatedRules
      })

      setSelectedTournament({
        ...selectedTournament,
        rules: updatedRules
      })
      toast({
        title: "Success",
        description: "Rule deleted successfully"
      })
    } catch (error) {
      console.error("Error deleting rule:", error)
      toast({
        title: "Error",
        description: "Failed to delete rule",
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
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Tournaments</h2>
            <Button onClick={() => router.push("/admin/create")}>
              <Plus className="mr-2 h-4 w-4" />
              Create Tournament
            </Button>
          </div>

          <div className="grid gap-6">
            {tournaments.map((tournament) => (
              <Card key={tournament.id}>
                <CardHeader>
                  <CardTitle>{tournament.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-500">Format: {tournament.format}</p>
                        <p className="text-sm text-gray-500">Location: {tournament.location}</p>
                        <p className="text-sm text-gray-500">Teams: {tournament.teamCount}/{tournament.maxTeams}</p>
                      </div>
                      <Button
                        variant={selectedTournament?.id === tournament.id ? "default" : "outline"}
                        onClick={() => setSelectedTournament(tournament)}
                      >
                        {selectedTournament?.id === tournament.id ? "Selected" : "Select"}
                      </Button>
                    </div>

                    {selectedTournament?.id === tournament.id && (
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add new rule..."
                            value={newRule}
                            onChange={(e) => setNewRule(e.target.value)}
                          />
                          <Button onClick={handleAddRule}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="space-y-2">
                          {(tournament.rules || []).map((rule, index) => (
                            <div key={index} className="flex items-center gap-2">
                              {editingRuleIndex === index ? (
                                <>
                                  <Input
                                    value={editingRule}
                                    onChange={(e) => setEditingRule(e.target.value)}
                                  />
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleUpdateRule(index)}
                                  >
                                    <Save className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => {
                                      setEditingRuleIndex(null)
                                      setEditingRule("")
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <span className="flex-1">{rule}</span>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => {
                                      setEditingRuleIndex(index)
                                      setEditingRule(rule)
                                    }}
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleDeleteRule(index)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
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
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

