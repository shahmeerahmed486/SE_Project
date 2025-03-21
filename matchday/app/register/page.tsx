"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Plus, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function RegisterPage() {
  const [teamName, setTeamName] = useState("")
  const [captainName, setCaptainName] = useState("")
  const [captainEmail, setCaptainEmail] = useState("")
  const [captainPhone, setCaptainPhone] = useState("")
  const [players, setPlayers] = useState([{ name: "", position: "" }])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const addPlayer = () => {
    setPlayers([...players, { name: "", position: "" }])
  }

  const removePlayer = (index: number) => {
    const updatedPlayers = [...players]
    updatedPlayers.splice(index, 1)
    setPlayers(updatedPlayers)
  }

  const updatePlayer = (index: number, field: string, value: string) => {
    const updatedPlayers = [...players]
    updatedPlayers[index] = { ...updatedPlayers[index], [field]: value }
    setPlayers(updatedPlayers)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // For demo purposes, just simulate the registration
      toast({
        title: "Registration submitted",
        description: "Your team registration has been submitted for review.",
      })

      // Reset form
      setTeamName("")
      setCaptainName("")
      setCaptainEmail("")
      setCaptainPhone("")
      setPlayers([{ name: "", position: "" }])
    } catch (error: any) {
      console.error("Registration error:", error)
      toast({
        title: "Registration failed",
        description: error.message || "Failed to submit registration. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-10">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <Trophy className="h-6 w-6" />
        <span className="font-bold">Matchday</span>
      </Link>

      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Team Registration</CardTitle>
          <CardDescription>Register your team for upcoming tournaments</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="teamName">Team Name</Label>
              <Input id="teamName" value={teamName} onChange={(e) => setTeamName(e.target.value)} required />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Captain Information</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="captainName">Captain Name</Label>
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
                <div className="space-y-2">
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
                <Button type="button" variant="outline" size="sm" onClick={addPlayer}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Player
                </Button>
              </div>

              {players.map((player, index) => (
                <div key={index} className="grid gap-4 sm:grid-cols-2 items-end border p-4 rounded-md">
                  <div className="space-y-2">
                    <Label htmlFor={`playerName-${index}`}>Player Name</Label>
                    <Input
                      id={`playerName-${index}`}
                      value={player.name}
                      onChange={(e) => updatePlayer(index, "name", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`playerPosition-${index}`}>Position</Label>
                    <Input
                      id={`playerPosition-${index}`}
                      value={player.position}
                      onChange={(e) => updatePlayer(index, "position", e.target.value)}
                    />
                  </div>
                  {players.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="sm:col-span-2 w-8 h-8 ml-auto"
                      onClick={() => removePlayer(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Submitting..." : "Submit Registration"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

