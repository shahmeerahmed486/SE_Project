"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trophy, Plus, Edit, Trash2, ArrowLeft } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Match, Team, Tournament } from "@/types"

export default function ManageMatchesPage({ params }: { params: { id: string } }) {
  const [matches, setMatches] = useState<Match[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // New match form data
  const [teamA, setTeamA] = useState("")
  const [teamB, setTeamB] = useState("")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [location, setLocation] = useState("")
  const [round, setRound] = useState("")
  const [matchId, setMatchId] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  
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

    const fetchTournamentData = async () => {
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
          where("tournamentId", "==", params.id),
          where("status", "==", "approved")
        )
        
        const teamsSnapshot = await getDocs(teamsQuery)
        const teamsData: Team[] = []
        
        teamsSnapshot.forEach((doc) => {
          teamsData.push({
            id: doc.id,
            ...doc.data()
          } as Team)
        })
        
        setTeams(teamsData)
        
        // Get matches for this tournament
        const matchesQuery = query(
          collection(db, "matches"), 
          where("tournamentId", "==", params.id)
        )
        
        const matchesSnapshot = await getDocs(matchesQuery)
        const matchesData: Match[] = []
        
        matchesSnapshot.forEach((doc) => {
          matchesData.push({
            id: doc.id,
            ...doc.data()
          } as Match)
        })
        
        setMatches(matchesData)
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

    fetchTournamentData()
  }, [user, params.id, router, toast])
  
  const resetForm = () => {
    setTeamA("")
    setTeamB("")
    setDate("")
    setTime("")
    setLocation("")
    setRound("")
    setMatchId("")
    setIsEditing(false)
  }
  
  const handleEditMatch = (match: Match) => {
    setTeamA(match.teamA)
    setTeamB(match.teamB)
    setDate(match.date)
    setTime(match.time)
    setLocation(match.location)
    setRound(match.round || "")
    setMatchId(match.id)
    setIsEditing(true)
  }
  
  const handleCreateMatch = async () => {
    try {
      if (teamA === teamB) {
        toast({
          title: "Invalid teams",
          description: "A team cannot play against itself.",
          variant: "destructive",
        })
        return
      }

      const matchData = {
        tournamentId: params.id,
        teamA,
        teamB,
        date,
        time,
        location,
        round,
        scoreA: null,
        scoreB: null,
        status: "scheduled",
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      }
      
      await addDoc(collection(db, "matches"), matchData)
      
      toast({
        title: "Match created",
        description: "The match has been created successfully.",
      })
      
      // Refresh matches
      const matchesQuery = query(collection(db, "matches"), where("tournamentId", "==", params.id))
      const matchesSnapshot = await getDocs(matchesQuery)
      const matchesData: Match[] = []
      
      matchesSnapshot.forEach((doc) => {
        matchesData.push({
          id: doc.id,
          ...doc.data()
        } as Match)
      })
      
      setMatches(matchesData)
      resetForm()
    } catch (error) {
      console.error("Error creating match:", error)
      toast({
        title: "Error",
        description: "Failed to create match.",
        variant: "destructive",
      })
    }
  }
  
  const handleUpdateMatch = async () => {
    try {
      if (teamA === teamB) {
        toast({
          title: "Invalid teams",
          description: "A team cannot play against itself.",
          variant: "destructive",
        })
        return
      }

      const matchData = {
        teamA,
        teamB,
        date,
        time,
        location,
        round,
        updatedBy: user.uid,
        updatedAt: serverTimestamp(),
      }
      
      await updateDoc(doc(db, "matches", matchId), matchData)
      
      toast({
        title: "Match updated",
        description: "The match has been updated successfully.",
      })
      
      // Refresh matches
      const matchesQuery = query(collection(db, "matches"), where("tournamentId", "==", params.id))
      const matchesSnapshot = await getDocs(matchesQuery)
      const matchesData: Match[] = []
      
      matchesSnapshot.forEach((doc) => {
        matchesData.push({
          id: doc.id,
          ...doc.data()
        } as Match)
      })
      
      setMatches(matchesData)
      resetForm()
    } catch (error) {
      console.error("Error updating match:", error)
      toast({
        title: "Error",
        description: "Failed to update match.",
        variant: "destructive",
      })
    }
  }
  
  const handleDeleteMatch = async (matchId: string) => {
    if (confirm("Are you sure you want to delete this match?")) {
      try {
        await deleteDoc(doc(db, "matches", matchId))
        
        toast({
          title: "Match deleted",
          description: "The match has been deleted successfully.",
        })
        
        // Refresh matches
        setMatches(matches.filter(match => match.id !== matchId))
      } catch (error) {
        console.error("Error deleting match:", error)
        toast({
          title: "Error",
          description: "Failed to delete match.",
          variant: "destructive",
        })
      }
    }
  }
  
  const handleUpdateScore = async (matchId: string, scoreA: number, scoreB: number) => {
    try {
      await updateDoc(doc(db, "matches", matchId), {
        scoreA,
        scoreB,
        status: "completed",
        updatedBy: user.uid,
        updatedAt: serverTimestamp(),
      })
      
      toast({
        title: "Score updated",
        description: "The match score has been updated.",
      })
      
      // Refresh matches
      const updatedMatches = matches.map(match => {
        if (match.id === matchId) {
          return {
            ...match,
            scoreA,
            scoreB,
            status: "completed"
          }
        }
        return match
      })
      
      setMatches(updatedMatches)
    } catch (error) {
      console.error("Error updating score:", error)
      toast({
        title: "Error",
        description: "Failed to update match score.",
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
          <Trophy className="h-6 w-6" />
          Manage Matches: {tournament?.name}
        </h1>
      </div>

      <div className="grid gap-6">
        {/* Create/Edit Match */}
        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? "Edit Match" : "Create New Match"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="teamA">Team A</Label>
                <Select value={teamA} onValueChange={setTeamA} required>
                  <SelectTrigger id="teamA">
                    <SelectValue placeholder="Select Team A" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map(team => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="teamB">Team B</Label>
                <Select value={teamB} onValueChange={setTeamB} required>
                  <SelectTrigger id="teamB">
                    <SelectValue placeholder="Select Team B" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map(team => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="round">Round/Stage</Label>
                <Input
                  id="round"
                  value={round}
                  onChange={(e) => setRound(e.target.value)}
                  placeholder="e.g., Group Stage, Quarter-final, etc."
                />
              </div>
              
              <div className="flex gap-2 sm:col-span-2">
                {isEditing ? (
                  <>
                    <Button onClick={handleUpdateMatch} className="flex-1">
                      Update Match
                    </Button>
                    <Button variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button onClick={handleCreateMatch} className="flex-1">
                    Create Match
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Matches List */}
        <Card>
          <CardHeader>
            <CardTitle>All Matches</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Teams</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Round</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      No matches found. Create one to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  matches.map((match) => {
                    const teamAName = teams.find(t => t.id === match.teamA)?.name || match.teamA
                    const teamBName = teams.find(t => t.id === match.teamB)?.name || match.teamB
                    
                    return (
                      <TableRow key={match.id}>
                        <TableCell className="font-medium">
                          {teamAName} vs {teamBName}
                        </TableCell>
                        <TableCell>
                          {new Date(match.date).toLocaleDateString()} at {match.time}
                        </TableCell>
                        <TableCell>{match.location}</TableCell>
                        <TableCell>{match.round}</TableCell>
                        <TableCell>
                          <Badge className={
                            match.status === "completed" ? "bg-green-100 text-green-800" :
                            match.status === "in_progress" ? "bg-blue-100 text-blue-800" :
                            "bg-gray-100 text-gray-800"
                          }>
                            {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {match.status === "completed" ? (
                            <span className="font-medium">
                              {match.scoreA} - {match.scoreB}
                            </span>
                          ) : (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  Update Score
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Update Match Score</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                  <div className="flex items-center gap-4">
                                    <div className="flex-1 text-center">
                                      <p className="mb-2">{teamAName}</p>
                                      <Input
                                        id={`scoreA-${match.id}`}
                                        type="number"
                                        min="0"
                                        defaultValue={match.scoreA || 0}
                                        className="text-center"
                                      />
                                    </div>
                                    <div className="text-xl font-bold">vs</div>
                                    <div className="flex-1 text-center">
                                      <p className="mb-2">{teamBName}</p>
                                      <Input
                                        id={`scoreB-${match.id}`}
                                        type="number"
                                        min="0"
                                        defaultValue={match.scoreB || 0}
                                        className="text-center"
                                      />
                                    </div>
                                  </div>
                                </div>
                                <DialogFooter>
                                  <DialogClose asChild>
                                    <Button variant="outline">Cancel</Button>
                                  </DialogClose>
                                  <Button 
                                    onClick={() => {
                                      const scoreA = parseInt((document.getElementById(`scoreA-${match.id}`) as HTMLInputElement).value)
                                      const scoreB = parseInt((document.getElementById(`scoreB-${match.id}`) as HTMLInputElement).value)
                                      handleUpdateScore(match.id, scoreA, scoreB)
                                    }}
                                  >
                                    Save Result
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditMatch(match)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteMatch(match.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 