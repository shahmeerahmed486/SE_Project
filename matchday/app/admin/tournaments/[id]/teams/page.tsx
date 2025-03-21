"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { collection, query, where, getDocs, doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trophy, ArrowLeft, UserCheck, UserX, Users, Eye } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Team, Tournament } from "@/types"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export default function TeamsManagementPage({ params }: { params: { id: string } }) {
  const [teams, setTeams] = useState<Team[]>([])
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
      } else {
        router.push("/login")
      }
    })

    return () => unsubscribe()
  }, [router])

  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      try {
        // Get tournament
        const tournamentDoc = await getDoc(doc(db, "tournaments", params.id))
        
        if (!tournamentDoc.exists()) {
          toast({
            title: "Tournament not found",
            description: "The requested tournament could not be found.",
            variant: "destructive",
          })
          router.push("/admin/tournaments")
          return
        }
        
        const tournamentData = tournamentDoc.data()
        setTournament({
          id: tournamentDoc.id,
          ...tournamentData
        } as Tournament)
        
        // Get teams for this tournament
        const teamsQuery = query(
          collection(db, "teams"), 
          where("tournamentId", "==", params.id)
        )
        
        const teamsSnapshot = await getDocs(teamsQuery)
        const teamsData: Team[] = []
        
        teamsSnapshot.forEach((doc) => {
          teamsData.push({
            id: doc.id,
            ...doc.data()
          } as Team)
        })
        
        // Sort teams: pending first, then approved, then rejected
        teamsData.sort((a, b) => {
          if (a.status === 'pending' && b.status !== 'pending') return -1
          if (a.status !== 'pending' && b.status === 'pending') return 1
          return 0
        })
        
        setTeams(teamsData)
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to load tournament data.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, params.id, router, toast])
  
  const handleApproveTeam = async (teamId: string) => {
    try {
      // Check if tournament is full
      if (tournament && tournament.teamCount >= tournament.maxTeams) {
        toast({
          title: "Tournament is full",
          description: `The maximum number of teams (${tournament.maxTeams}) has been reached.`,
          variant: "destructive",
        })
        return
      }
      
      await updateDoc(doc(db, "teams", teamId), {
        status: "approved",
        updatedBy: user.uid,
        updatedAt: serverTimestamp(),
      })
      
      // Update tournament team count
      if (tournament) {
        await updateDoc(doc(db, "tournaments", params.id), {
          teamCount: tournament.teamCount + 1,
          updatedBy: user.uid,
          updatedAt: serverTimestamp(),
        })
        
        // Update local tournament data
        setTournament({
          ...tournament,
          teamCount: tournament.teamCount + 1
        })
      }
      
      toast({
        title: "Team approved",
        description: "The team has been approved and added to the tournament.",
      })
      
      // Update local team data
      setTeams(teams.map(team => 
        team.id === teamId ? { ...team, status: "approved" } : team
      ))
    } catch (error) {
      console.error("Error approving team:", error)
      toast({
        title: "Error",
        description: "Failed to approve team.",
        variant: "destructive",
      })
    }
  }
  
  const handleRejectTeam = async (teamId: string) => {
    try {
      await updateDoc(doc(db, "teams", teamId), {
        status: "rejected",
        updatedBy: user.uid,
        updatedAt: serverTimestamp(),
      })
      
      toast({
        title: "Team rejected",
        description: "The team has been rejected from the tournament.",
      })
      
      // Update local team data
      setTeams(teams.map(team => 
        team.id === teamId ? { ...team, status: "rejected" } : team
      ))
    } catch (error) {
      console.error("Error rejecting team:", error)
      toast({
        title: "Error",
        description: "Failed to reject team.",
        variant: "destructive",
      })
    }
  }
  
  const handleEliminateTeam = async (teamId: string) => {
    try {
      await updateDoc(doc(db, "teams", teamId), {
        status: "eliminated",
        updatedBy: user.uid,
        updatedAt: serverTimestamp(),
      })
      
      toast({
        title: "Team eliminated",
        description: "The team has been marked as eliminated from the tournament.",
      })
      
      // Update local team data
      setTeams(teams.map(team => 
        team.id === teamId ? { ...team, status: "eliminated" } : team
      ))
    } catch (error) {
      console.error("Error eliminating team:", error)
      toast({
        title: "Error",
        description: "Failed to eliminate team.",
        variant: "destructive",
      })
    }
  }

  if (!user || loading) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between mb-8">
        <Link href={`/admin/tournaments/${params.id}`} className="flex items-center gap-2">
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Tournament</span>
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" />
          Manage Teams: {tournament?.name}
        </h1>
      </div>

      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Tournament Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-md">
                <div className="text-sm font-medium text-muted-foreground">Registered Teams</div>
                <div className="text-2xl font-bold">{teams.filter(t => t.status === "approved").length}</div>
              </div>
              <div className="p-4 border rounded-md">
                <div className="text-sm font-medium text-muted-foreground">Pending Approvals</div>
                <div className="text-2xl font-bold">{teams.filter(t => t.status === "pending").length}</div>
              </div>
              <div className="p-4 border rounded-md">
                <div className="text-sm font-medium text-muted-foreground">Max Teams</div>
                <div className="text-2xl font-bold">{tournament?.maxTeams}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Manage Team Registrations</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team Name</TableHead>
                <TableHead>Captain</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registration Date</TableHead>
                <TableHead>Players</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    No team registrations yet.
                  </TableCell>
                </TableRow>
              ) : (
                teams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell className="font-medium">{team.name}</TableCell>
                    <TableCell>
                      <div>{team.captain.name}</div>
                      <div className="text-xs text-muted-foreground">{team.captain.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        team.status === "approved" ? "bg-green-100 text-green-800" :
                        team.status === "pending" ? "bg-amber-100 text-amber-800" :
                        team.status === "eliminated" ? "bg-blue-100 text-blue-800" :
                        "bg-red-100 text-red-800"
                      }>
                        {team.status.charAt(0).toUpperCase() + team.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {team.createdAt?.toDate ? 
                        format(team.createdAt.toDate(), 'MMM dd, yyyy') : 
                        "Recent"}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            {team.players?.length || 0} Players
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                          <DialogHeader>
                            <DialogTitle>Players - {team.name}</DialogTitle>
                            <DialogDescription>
                              Team captain: {team.captain.name} ({team.captain.email})
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="mt-4">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Name</TableHead>
                                  <TableHead>Position</TableHead>
                                  <TableHead>Jersey Number</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {team.players?.map((player, index) => (
                                  <TableRow key={index}>
                                    <TableCell>{player.name}</TableCell>
                                    <TableCell>{player.position || "-"}</TableCell>
                                    <TableCell>{player.number || "-"}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {team.status === "pending" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-green-600 border-green-200 hover:bg-green-50"
                              onClick={() => handleApproveTeam(team.id)}
                            >
                              <UserCheck className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => handleRejectTeam(team.id)}
                            >
                              <UserX className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        
                        {team.status === "approved" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEliminateTeam(team.id)}
                          >
                            Mark Eliminated
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
} 