"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, ArrowLeft } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function CreateTournamentPage() {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [location, setLocation] = useState("")
  const [format, setFormat] = useState("")
  const [maxTeams, setMaxTeams] = useState("16")
  const [status, setStatus] = useState("upcoming")
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Create tournament document in Firestore
      await addDoc(collection(db, "tournaments"), {
        name,
        description,
        startDate,
        endDate,
        location,
        format,
        maxTeams: Number.parseInt(maxTeams),
        teamCount: 0,
        status,
        createdAt: serverTimestamp(),
        createdBy: user?.uid,
      })

      toast({
        title: "Tournament created",
        description: "Your tournament has been created successfully.",
      })

      router.push("/admin/tournaments")
    } catch (error: any) {
      toast({
        title: "Failed to create tournament",
        description: error.message || "An error occurred while creating the tournament.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="container py-10">
      <div className="flex items-center gap-2 mb-8">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            <CardTitle className="text-2xl">Create Tournament</CardTitle>
          </div>
          <CardDescription>Create a new tournament and define its parameters</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Tournament Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} required />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="format">Tournament Format</Label>
                <Select value={format} onValueChange={setFormat} required>
                  <SelectTrigger id="format">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Knockout">Knockout</SelectItem>
                    <SelectItem value="League">League</SelectItem>
                    <SelectItem value="Round Robin">Round Robin</SelectItem>
                    <SelectItem value="League + Knockout">League + Knockout</SelectItem>
                    <SelectItem value="Group Stage">Group Stage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxTeams">Maximum Teams</Label>
                <Select value={maxTeams} onValueChange={setMaxTeams} required>
                  <SelectTrigger id="maxTeams">
                    <SelectValue placeholder="Select max teams" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4">4 Teams</SelectItem>
                    <SelectItem value="8">8 Teams</SelectItem>
                    <SelectItem value="16">16 Teams</SelectItem>
                    <SelectItem value="24">24 Teams</SelectItem>
                    <SelectItem value="32">32 Teams</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus} required>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Create Tournament"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

