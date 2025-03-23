"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStatus } from "@/src/hooks/useAuthStatus"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Tournament, User, UserRole, ManagementTeam } from "@/types"
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { AuthService } from "@/src/api/services/AuthService"
import { Plus, Users, Trophy, Settings, ArrowRight, Calendar, MapPin, Check, X, Pencil, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"

export default function AdminDashboard() {
  const { user, loading } = useAuthStatus()
  const router = useRouter()
  const { toast } = useToast()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [managementUsers, setManagementUsers] = useState<User[]>([])
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null)
  const [newRule, setNewRule] = useState("")
  const [editingRuleIndex, setEditingRuleIndex] = useState<number | null>(null)
  const [editingRule, setEditingRule] = useState("")

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

  const [selectedManagementUser, setSelectedManagementUser] = useState<ManagementTeam | null>(null)
  const [assignableTournaments, setAssignableTournaments] = useState<Tournament[]>([])

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
        const tournamentsData = tournamentsSnapshot.docs.map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data,
            startDate: data.startDate ? new Date(data.startDate).toISOString() : null,
            endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
            registrationDeadline: data.registrationDeadline ? new Date(data.registrationDeadline).toISOString() : null
          }
        }) as Tournament[]
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

  const handleAddRule = async () => {
    if (!selectedTournament || !newRule.trim()) return

    try {
      const tournamentRef = doc(db, "tournaments", selectedTournament.id)
      await updateDoc(tournamentRef, {
        rules: arrayUnion(newRule.trim())
      })

      // Update local state
      setTournaments(tournaments.map(t => 
        t.id === selectedTournament.id 
          ? { ...t, rules: [...(t.rules || []), newRule.trim()] }
          : t
      ))
      setSelectedTournament(prev => prev ? {
        ...prev,
        rules: [...(prev.rules || []), newRule.trim()]
      } : null)
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

  const handleEditRule = async (index: number) => {
    if (!selectedTournament || !editingRule.trim()) return

    try {
      const tournamentRef = doc(db, "tournaments", selectedTournament.id)
      const updatedRules = [...(selectedTournament.rules || [])]
      updatedRules[index] = editingRule.trim()

      await updateDoc(tournamentRef, {
        rules: updatedRules
      })

      // Update local state
      setTournaments(tournaments.map(t => 
        t.id === selectedTournament.id 
          ? { ...t, rules: updatedRules }
          : t
      ))
      setSelectedTournament(prev => prev ? {
        ...prev,
        rules: updatedRules
      } : null)
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
      const ruleToDelete = selectedTournament.rules?.[index]
      
      if (!ruleToDelete) return

      await updateDoc(tournamentRef, {
        rules: arrayRemove(ruleToDelete)
      })

      // Update local state
      const updatedRules = selectedTournament.rules?.filter((_, i) => i !== index) || []
      setTournaments(tournaments.map(t => 
        t.id === selectedTournament.id 
          ? { ...t, rules: updatedRules }
          : t
      ))
      setSelectedTournament(prev => prev ? {
        ...prev,
        rules: updatedRules
      } : null)

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

  const handleManageAssignments = async (user: ManagementTeam) => {
    setSelectedManagementUser(user)
    try {
      // Fetch tournaments that are in DRAFT or REGISTRATION state
      const tournamentsSnapshot = await getDocs(collection(db, "tournaments"))
      const activeTournaments = tournamentsSnapshot.docs
        .map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            name: data.name,
            format: data.format,
            startDate: data.startDate,
            endDate: data.endDate,
            registrationDeadline: data.registrationDeadline,
            teamLimit: data.teamLimit,
            status: data.status,
            teamCount: data.teamCount,
            managementTeam: data.managementTeam,
            createdBy: data.createdBy,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            rules: data.rules
          } as Tournament
        })
        .filter(tournament => 
          tournament.status === "DRAFT" || tournament.status === "REGISTRATION"
        )
      setAssignableTournaments(activeTournaments)
    } catch (error) {
      console.error("Error fetching assignable tournaments:", error)
      toast({
        title: "Error",
        description: "Failed to load assignable tournaments",
        variant: "destructive"
      })
    }
  }

  const handleAssignmentChange = async (tournamentId: string, isAssigned: boolean) => {
    if (!selectedManagementUser) return

    try {
      const userRef = doc(db, "users", selectedManagementUser.id)
      const updatedAssignments = isAssigned
        ? arrayUnion(tournamentId)
        : arrayRemove(tournamentId)

      await updateDoc(userRef, {
        assignedTournaments: updatedAssignments
      })

      // Update local state
      setManagementUsers(managementUsers.map(user => 
        user.id === selectedManagementUser.id
          ? {
              ...user,
              assignedTournaments: isAssigned
                ? [...(user as ManagementTeam).assignedTournaments, tournamentId]
                : (user as ManagementTeam).assignedTournaments.filter(id => id !== tournamentId)
            }
          : user
      ))

      setSelectedManagementUser(prev => prev ? {
        ...prev,
        assignedTournaments: isAssigned
          ? [...prev.assignedTournaments, tournamentId]
          : prev.assignedTournaments.filter(id => id !== tournamentId)
      } : null)

      toast({
        title: "Success",
        description: `Tournament ${isAssigned ? 'assigned' : 'unassigned'} successfully`
      })
    } catch (error) {
      console.error("Error updating assignments:", error)
      toast({
        title: "Error",
        description: "Failed to update tournament assignments",
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage tournaments and users</p>
        </div>
        <Button onClick={() => router.push("/admin/create")}>
          <Plus className="mr-2 h-4 w-4" />
          Create Tournament
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tournaments</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tournaments.length}</div>
            <p className="text-xs text-muted-foreground">
              Active tournaments
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Management Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{managementUsers.length}</div>
            <p className="text-xs text-muted-foreground">
              Active management users
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Active</div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tournaments" className="space-y-6">
        <TabsList>
          <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
          <TabsTrigger value="users">Management Users</TabsTrigger>
        </TabsList>

        <TabsContent value="tournaments" className="space-y-6">
          <div className="grid gap-6">
            {tournaments.map((tournament) => (
              <Card key={tournament.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{tournament.name}</CardTitle>
                      <CardDescription>{tournament.rules?.join(', ') || 'No rules specified'}</CardDescription>
                    </div>
                    <Badge variant={tournament.status === 'IN_PROGRESS' ? 'default' : 'secondary'}>
                      {tournament.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {tournament.startDate && tournament.endDate ? (
                          <>
                            {format(new Date(tournament.startDate), 'MMM dd, yyyy')} - {format(new Date(tournament.endDate), 'MMM dd, yyyy')}
                          </>
                        ) : (
                          'Dates not set'
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {tournament.registrationDeadline ? (
                          `Registration Deadline: ${format(new Date(tournament.registrationDeadline), 'MMM dd, yyyy')}`
                        ) : (
                          'No registration deadline set'
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {tournament.teamCount}/{tournament.teamLimit} teams
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedTournament(tournament)}
                    >
                      Manage Rules
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create Management User</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={newUser.username}
                      onChange={(e) => setNewUser({
                        ...newUser,
                        username: e.target.value
                      })}
                    />
                  </div>
                  <div className="space-y-2">
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
                </div>
                <div className="space-y-2">
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

          <div className="grid gap-6">
            {managementUsers.map((user) => (
              <Card key={user.id}>
                <CardHeader>
                  <CardTitle>{user.username}</CardTitle>
                  <CardDescription>{user.email}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Assigned Tournaments</p>
                      <p className="text-sm text-muted-foreground">
                        {(user as ManagementTeam).assignedTournaments?.length || 0} tournaments
                      </p>
                    </div>
                    <Button 
                      variant="outline"
                      onClick={() => handleManageAssignments(user as ManagementTeam)}
                    >
                      Manage Assignments
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Tournament Assignment Dialog */}
      <Dialog open={!!selectedManagementUser} onOpenChange={() => setSelectedManagementUser(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Manage Tournament Assignments for {selectedManagementUser?.username}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              {assignableTournaments.map((tournament) => (
                <div key={tournament.id} className="flex items-center space-x-2 p-2 border rounded">
                  <Checkbox
                    id={`tournament-${tournament.id}`}
                    checked={selectedManagementUser?.assignedTournaments.includes(tournament.id)}
                    onCheckedChange={(checked) => 
                      handleAssignmentChange(tournament.id, checked as boolean)
                    }
                  />
                  <label
                    htmlFor={`tournament-${tournament.id}`}
                    className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {tournament.name}
                  </label>
                  <Badge variant={tournament.status === 'IN_PROGRESS' ? 'default' : 'secondary'}>
                    {tournament.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rules Dialog */}
      <Dialog open={!!selectedTournament} onOpenChange={() => setSelectedTournament(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Define Rules for {selectedTournament?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter a new rule"
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddRule()}
              />
              <Button onClick={handleAddRule}>
                Add Rule
              </Button>
            </div>
            <div className="space-y-2">
              {selectedTournament?.rules?.map((rule, index) => (
                <div key={index} className="flex items-center gap-2 p-2 border rounded">
                  {editingRuleIndex === index ? (
                    <>
                      <Input
                        value={editingRule}
                        onChange={(e) => setEditingRule(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleEditRule(index)}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEditRule(index)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
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
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setEditingRuleIndex(index)
                          setEditingRule(rule)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
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
        </DialogContent>
      </Dialog>
    </div>
  )
}

