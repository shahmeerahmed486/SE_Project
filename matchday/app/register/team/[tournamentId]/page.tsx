"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { collection, addDoc, doc, getDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Tournament } from "@/types"

export default function TeamRegistrationPage({ params }: { params: { tournamentId: string } }) {
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [teamName, setTeamName] = useState("")
  const [captainName, setCaptainName] = useState("")
  const [captainEmail, setCaptainEmail] = useState("")
  const [captainPhone, setCaptainPhone] = useState("")
  const [players, setPlayers] = useState([{ name: "", position: "", number: "" }])
  const [loading, setLoading] = useState(false)
  const [tournamentLoading, setTournamentLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const fetchTournament = async () => {
      try {
        const tournamentDoc = await getDoc(doc(db, "tournaments", params.tournamentId))
        
        if (tournamentDoc.exists()) {
          const data = tournamentDoc.data() as Tournament
          setTournament({
            id: tournamentDoc.id,
            ...data
          })
        } else {
          toast({
            title: "Tournament not found",
            description: "The requested tournament could not be found.",
            variant: "destructive",
          })
          router.push("/tournaments")
        }
      } catch (error) {
        console.error("Error fetching tournament:", error)
        toast({
          title: "Error",
          description: "Failed to load tournament details.",
          variant: "destructive",
        })
      } finally {
        setTournamentLoading(false)
      }
    }

    fetchTournament()
  }, [params.tournamentId, router, toast])

  const addPlayer = () => {
    setPlayers([...players, { name: "", position: "", number: "" }])
  }

  const updatePlayer = (index: number, field: string, value: string) => {
    const updatedPlayers = [...players]
    updatedPlayers[index] = { ...updatedPlayers[index], [field]: value }
    setPlayers(updatedPlayers)
  }

  const removePlayer = (index: number) => {
    if (players.length > 1) {
      const updatedPlayers = [...players]
      updatedPlayers.splice(index, 1)
      setPlayers(updatedPlayers)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Clean up player data
      const formattedPlayers = players.filter(player => player.name.trim() !== "").map(player => ({
        name: player.name,
        position: player.position || "",
        number: player.number ? parseInt(player.number) : null,
      }))

      // Create team document in Firestore
      await addDoc(collection(db, "teams"), {
        name: teamName,
        tournamentId: params.tournamentId,
        captain: {
          name: captainName,
          email: captainEmail,
          phone: captainPhone,
        },
        players: formattedPlayers,
        status: "pending",
        createdAt: serverTimestamp(),
      })

      toast({
        title: "Registration submitted",
        description: "Your team registration has been submitted for approval.",
      })

      router.push(`/tournaments/${params.tournamentId}`)
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "An error occurred while registering your team.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (tournamentLoading) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!tournament) {
    return (
      <div className="container py-10">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Tournament not found</h1>
          <p className="mt-4">The tournament you are looking for does not exist.</p>
          <Link href="/tournaments" className="mt-6 inline-block">
            <Button>View All Tournaments</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <Link href={`/tournaments/${params.tournamentId}`} className="flex items-center gap-2 mb-8">
        <Trophy className="h-6 w-6" />
        <span className="font-bold">Back to Tournament</span>
      </Link>

      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Team Registration</CardTitle>
          <CardDescription>Register your team for {tournament.name}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="teamName">Team Name</Label>
              <Input 
                id="teamName" 
                value={teamName} 
                onChange={(e) => setTeamName(e.target.value)} 
                required 
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Captain Information</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="captainName">Name</Label>
                  <Input 
                    id="captainName" 
                    value={captainName} 
                    onChange={(e) => setCaptainName(e.target.value)} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="captainEmail">Email</Label>
                  <Input 
                    id="captainEmail" 
                    type="email" 
                    value={captainEmail} 
                    onChange={(e) => setCaptainEmail(e.target.value)} 
                    required 
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="captainPhone">Phone Number</Label>
                  <Input 
                    id="captainPhone" 
                    value={captainPhone} 
                    onChange={(e) => setCaptainPhone(e.target.value)} 
                    required 
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Players</h3>
                <Button type="button" variant="outline" onClick={addPlayer}>
                  Add Player
                </Button>
              </div>
              
              {players.map((player, index) => (
                <div key={index} className="space-y-4 p-4 border rounded-md">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Player {index + 1}</h4>
                    {players.length > 1 && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removePlayer(index)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor={`playerName${index}`}>Name</Label>
                      <Input 
                        id={`playerName${index}`} 
                        value={player.name} 
                        onChange={(e) => updatePlayer(index, "name", e.target.value)} 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`playerPosition${index}`}>Position</Label>
                      <Input 
                        id={`playerPosition${index}`} 
                        value={player.position} 
                        onChange={(e) => updatePlayer(index, "position", e.target.value)} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`playerNumber${index}`}>Jersey Number</Label>
                      <Input 
                        id={`playerNumber${index}`} 
                        value={player.number} 
                        onChange={(e) => updatePlayer(index, "number", e.target.value)} 
                        type="number" 
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Submitting..." : "Register Team"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
} 