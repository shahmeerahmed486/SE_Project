"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/src/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { UserRole } from "@/types"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { ArrowLeft } from "lucide-react"

export default function CreateTournament() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [newTournament, setNewTournament] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    location: "",
    format: "KNOCKOUT" as "LEAGUE" | "KNOCKOUT" | "GROUP_KNOCKOUT",
    maxTeams: "16"
  })

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const tournamentData = {
        ...newTournament,
        maxTeams: parseInt(newTournament.maxTeams, 10),
        teamCount: 0,
        createdAt: serverTimestamp(),
        createdBy: user?.id || null,
        status: "DRAFT" as const,
        format: newTournament.format,
        rules: []
      }

      await addDoc(collection(db, "tournaments"), tournamentData)

      toast({
        title: "Success",
        description: "Tournament created successfully"
      })

      // Navigate back to dashboard
      router.push("/admin/dashboard")
    } catch (error: any) {
      console.error("Error creating tournament:", error)
      toast({
        title: "Error",
        description: "Failed to create tournament. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user || user.role !== UserRole.ADMIN) {
    router.push("/login")
    return null
  }

  return (
    <div className="container py-10">
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="outline"
          onClick={() => router.push("/admin/dashboard")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold">Create New Tournament</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleCreateTournament} className="space-y-4">
            <div>
              <Label htmlFor="name">Tournament Name</Label>
              <Input
                id="name"
                value={newTournament.name}
                onChange={(e) => setNewTournament({
                  ...newTournament,
                  name: e.target.value
                })}
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={newTournament.description}
                onChange={(e) => setNewTournament({
                  ...newTournament,
                  description: e.target.value
                })}
                required
              />
            </div>
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={newTournament.startDate}
                onChange={(e) => setNewTournament({
                  ...newTournament,
                  startDate: e.target.value
                })}
                required
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={newTournament.endDate}
                onChange={(e) => setNewTournament({
                  ...newTournament,
                  endDate: e.target.value
                })}
                required
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={newTournament.location}
                onChange={(e) => setNewTournament({
                  ...newTournament,
                  location: e.target.value
                })}
                required
              />
            </div>
            <div>
              <Label htmlFor="format">Format</Label>
              <Input
                id="format"
                value={newTournament.format}
                onChange={(e) => setNewTournament({
                  ...newTournament,
                  format: e.target.value as "LEAGUE" | "KNOCKOUT" | "GROUP_KNOCKOUT"
                })}
                required
              />
            </div>
            <div>
              <Label htmlFor="maxTeams">Maximum Teams</Label>
              <Input
                id="maxTeams"
                type="number"
                value={newTournament.maxTeams}
                onChange={(e) => setNewTournament({
                  ...newTournament,
                  maxTeams: e.target.value
                })}
                required
              />
            </div>
            <div className="flex gap-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Tournament"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/dashboard")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 