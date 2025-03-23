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
import { Tournament, User, UserRole, ManagementUser, Announcement, TournamentStatus, ManagementTeam } from "@/src/types"
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion, arrayRemove, addDoc, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { AuthService } from "@/src/api/services/AuthService"
import { Plus, Users, Trophy, Settings, ArrowRight, Calendar, MapPin, Check, X, Pencil, Trash2, Megaphone, ChevronDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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

  // States from both versions
  const [selectedManagementUser, setSelectedManagementUser] = useState<ManagementTeam | null>(null)
  const [assignableTournaments, setAssignableTournaments] = useState<Tournament[]>([])
  const [showAnnouncementDialog, setShowAnnouncementDialog] = useState(false)
  const [selectedTournamentForAnnouncement, setSelectedTournamentForAnnouncement] = useState<Tournament | null>(null)
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    description: ""
  })
  const [showEditTournamentDialog, setShowEditTournamentDialog] = useState(false)

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

  // Management team assignment functions
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
          tournament.status === TournamentStatus.DRAFT || tournament.status === TournamentStatus.REGISTRATION_OPEN
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

  const handleCreateAnnouncement = async () => {
    if (!selectedTournamentForAnnouncement || !newAnnouncement.title.trim() || !newAnnouncement.description.trim()) return

    try {
      const announcement: Omit<Announcement, 'id'> = {
        tournamentId: selectedTournamentForAnnouncement.id,
        title: newAnnouncement.title.trim(),
        description: newAnnouncement.description.trim(),
        content: newAnnouncement.description.trim(),
        priority: 'low',
        timestamp: new Date().toISOString(),
        createdBy: user?.id || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      await addDoc(collection(db, "announcements"), announcement)

      toast({
        title: "Success",
        description: "Announcement created successfully"
      })

      // Reset form and close dialog
      setNewAnnouncement({ title: "", description: "" })
      setShowAnnouncementDialog(false)
      setSelectedTournamentForAnnouncement(null)
    } catch (error) {
      console.error("Error creating announcement:", error)
      toast({
        title: "Error",
        description: "Failed to create announcement",
        variant: "destructive"
      })
    }
  }

  const handleUpdateTournament = async () => {
    if (!selectedTournament) return

    try {
      const tournamentRef = doc(db, "tournaments", selectedTournament.id)
      await updateDoc(tournamentRef, {
        name: selectedTournament.name,
        description: selectedTournament.description,
        startDate: selectedTournament.startDate,
        endDate: selectedTournament.endDate,
        location: selectedTournament.location,
        format: selectedTournament.format,
        maxTeams: selectedTournament.maxTeams,
        registrationDeadline: selectedTournament.registrationDeadline,
        updatedAt: new Date().toISOString()
      })

      // Update local state
      setTournaments(tournaments.map(t =>
        t.id === selectedTournament.id
          ? { ...t, ...selectedTournament }
          : t
      ))

      toast({
        title: "Success",
        description: "Tournament updated successfully"
      })

      setShowEditTournamentDialog(false)
      setSelectedTournament(null)
    } catch (error) {
      console.error("Error updating tournament:", error)
      toast({
        title: "Error",
        description: "Failed to update tournament",
        variant: "destructive"
      })
    }
  }

  const handleStatusChange = async (tournamentId: string, newStatus: TournamentStatus) => {
    try {
      const tournamentRef = doc(db, "tournaments", tournamentId)
      await updateDoc(tournamentRef, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      })

      // Update local state
      setTournaments(tournaments.map(t =>
        t.id === tournamentId
          ? { ...t, status: newStatus }
          : t
      ))

      toast({
        title: "Success",
        description: "Tournament status updated successfully"
      })
    } catch (error) {
      console.error("Error updating tournament status:", error)
      toast({
        title: "Error",
        description: "Failed to update tournament status",
        variant: "destructive"
      })
    }
  }

  const getStatusColor = (status: TournamentStatus) => {
    switch (status) {
      case TournamentStatus.DRAFT:
        return "bg-gray-100 text-gray-800"
      case TournamentStatus.REGISTRATION_OPEN:
        return "bg-green-100 text-green-800"
      case TournamentStatus.REGISTRATION_CLOSED:
        return "bg-yellow-100 text-yellow-800"
      case TournamentStatus.ONGOING:
        return "bg-blue-100 text-blue-800"
      case TournamentStatus.COMPLETED:
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleDeleteTournament = async (tournamentId: string) => {
    if (!confirm("Are you sure you want to delete this tournament? This action cannot be undone.")) {
      return
    }

    try {
      const tournamentRef = doc(db, "tournaments", tournamentId)
      await deleteDoc(tournamentRef)

      // Update local state
      setTournaments(tournaments.filter(t => t.id !== tournamentId))

      toast({
        title: "Success",
        description: "Tournament deleted successfully"
      })
    } catch (error) {
      console.error("Error deleting tournament:", error)
      toast({
        title: "Error",
        description: "Failed to delete tournament",
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
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Tournaments</h2>
            <Button onClick={() => router.push("/admin/create-tournament")}>
              <Plus className="h-4 w-4 mr-2" />
              New Tournament
            </Button>
          </div>

          <div className="grid gap-4">
            {tournaments.map((tournament) => (
              <Card key={tournament.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{tournament.name}</CardTitle>
                      <CardDescription>{tournament.rules?.join(', ') || 'No rules specified'}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedTournamentForAnnouncement(tournament)
                              setShowAnnouncementDialog(true)
                            }}
                          >
                            <Megaphone className="h-4 w-4 mr-2" />
                            Announce
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Create Announcement for {tournament.name}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="title">Title</Label>
                              <Input
                                id="title"
                                value={newAnnouncement.title}
                                onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="Enter announcement title"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="description">Description</Label>
                              <Textarea
                                id="description"
                                value={newAnnouncement.description}
                                onChange={(e) => setNewAnnouncement(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Enter announcement description"
                              />
                            </div>
                            <Button onClick={handleCreateAnnouncement} className="w-full">
                              Create Announcement
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTournament(tournament)
                          setShowEditTournamentDialog(true)
                        }}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit Details
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <span className={getStatusColor(tournament.status)}>
                              {tournament.status === TournamentStatus.DRAFT && '📝 Draft'}
                              {tournament.status === TournamentStatus.REGISTRATION_OPEN && '🏆 Registration Open'}
                              {tournament.status === TournamentStatus.REGISTRATION_CLOSED && '🚫 Registration Closed'}
                              {tournament.status === TournamentStatus.ONGOING && '⏳ Ongoing'}
                              {tournament.status === TournamentStatus.COMPLETED && '✅ Completed'}
                            </span>
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(tournament.id, TournamentStatus.DRAFT)}
                            disabled={tournament.status === TournamentStatus.DRAFT}
                          >
                            📝 Draft
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(tournament.id, TournamentStatus.REGISTRATION_OPEN)}
                            disabled={tournament.status === TournamentStatus.REGISTRATION_OPEN}
                          >
                            🏆 Registration Open
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(tournament.id, TournamentStatus.REGISTRATION_CLOSED)}
                            disabled={tournament.status === TournamentStatus.REGISTRATION_CLOSED}
                          >
                            🚫 Registration Closed
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(tournament.id, TournamentStatus.ONGOING)}
                            disabled={tournament.status === TournamentStatus.ONGOING}
                          >
                            ⏳ Ongoing
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(tournament.id, TournamentStatus.COMPLETED)}
                            disabled={tournament.status === TournamentStatus.COMPLETED}
                          >
                            ✅ Completed
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteTournament(tournament.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
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
                        {tournament.teamCount}/{tournament.maxTeams} teams
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
                  <CardTitle>{user.name}</CardTitle>
                  <CardDescription>{user.email}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Assigned Tournaments</p>
                      <p className="text-sm text-muted-foreground">
                        {(user as ManagementUser).assignedTournaments?.length || 0} tournaments
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
                  <Badge variant={tournament.status === TournamentStatus.ONGOING ? 'default' : 'secondary'}>
                    {tournament.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Tournament Dialog */}
      <Dialog open={showEditTournamentDialog} onOpenChange={setShowEditTournamentDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Tournament: {selectedTournament?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Tournament Name</Label>
                <Input
                  id="name"
                  value={selectedTournament?.name || ''}
                  onChange={(e) => setSelectedTournament(prev => prev ? { ...prev, name: e.target.value } : null)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={selectedTournament?.location || ''}
                  onChange={(e) => setSelectedTournament(prev => prev ? { ...prev, location: e.target.value } : null)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={selectedTournament?.description || ''}
                onChange={(e) => setSelectedTournament(prev => prev ? { ...prev, description: e.target.value } : null)}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={selectedTournament?.startDate ? format(new Date(selectedTournament.startDate), 'yyyy-MM-dd') : ''}
                  onChange={(e) => setSelectedTournament(prev => prev ? { ...prev, startDate: e.target.value } : null)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={selectedTournament?.endDate ? format(new Date(selectedTournament.endDate), 'yyyy-MM-dd') : ''}
                  onChange={(e) => setSelectedTournament(prev => prev ? { ...prev, endDate: e.target.value } : null)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="registrationDeadline">Registration Deadline</Label>
                <Input
                  id="registrationDeadline"
                  type="date"
                  value={selectedTournament?.registrationDeadline ? format(new Date(selectedTournament.registrationDeadline), 'yyyy-MM-dd') : ''}
                  onChange={(e) => setSelectedTournament(prev => prev ? { ...prev, registrationDeadline: e.target.value } : null)}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="format">Tournament Format</Label>
                <select
                  id="format"
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  value={selectedTournament?.format || 'KNOCKOUT'}
                  onChange={(e) => setSelectedTournament(prev => prev ? { ...prev, format: e.target.value } : null)}
                >
                  <option value="KNOCKOUT">Knockout</option>
                  <option value="LEAGUE">League</option>
                  <option value="GROUP_KNOCKOUT">Group + Knockout</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxTeams">Maximum Teams</Label>
                <Input
                  id="maxTeams"
                  type="number"
                  min="2"
                  value={selectedTournament?.maxTeams || 16}
                  onChange={(e) => setSelectedTournament(prev => prev ? { ...prev, maxTeams: parseInt(e.target.value) } : null)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedTournament(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateTournament}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rules Dialog */}
      <Dialog open={!!selectedTournament && !showEditTournamentDialog} onOpenChange={() => setSelectedTournament(null)}>
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

