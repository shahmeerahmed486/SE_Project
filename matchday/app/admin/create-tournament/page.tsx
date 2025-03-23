"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStatus } from "@/src/hooks/useAuthStatus"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Tournament, UserRole, TournamentStatus } from "@/src/types"
import { addDoc, collection } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function CreateTournament() {
    const { user, loading } = useAuthStatus()
    const router = useRouter()
    const { toast } = useToast()
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        startDate: "",
        endDate: "",
        location: "",
        format: "KNOCKOUT",
        maxTeams: 16,
        registrationDeadline: "",
        rules: [] as string[]
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || user.role !== UserRole.ADMIN) return

        try {
            const tournamentData: Omit<Tournament, 'id'> = {
                ...formData,
                status: TournamentStatus.DRAFT,
                teamCount: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }

            await addDoc(collection(db, "tournaments"), tournamentData)

            toast({
                title: "Success",
                description: "Tournament created successfully"
            })

            router.push("/admin/dashboard")
        } catch (error) {
            console.error("Error creating tournament:", error)
            toast({
                title: "Error",
                description: "Failed to create tournament",
                variant: "destructive"
            })
        }
    }

    if (loading) {
        return <div>Loading...</div>
    }

    if (!user || user.role !== UserRole.ADMIN) {
        router.push('/')
        return null
    }

    return (
        <div className="container py-10">
            <Card>
                <CardHeader>
                    <CardTitle>Create New Tournament</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">Tournament Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="location">Location</Label>
                                <Input
                                    id="location"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Input
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                required
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="startDate">Start Date</Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endDate">End Date</Label>
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="registrationDeadline">Registration Deadline</Label>
                                <Input
                                    id="registrationDeadline"
                                    type="date"
                                    value={formData.registrationDeadline}
                                    onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="maxTeams">Maximum Teams</Label>
                                <Input
                                    id="maxTeams"
                                    type="number"
                                    min="2"
                                    value={formData.maxTeams}
                                    onChange={(e) => setFormData({ ...formData, maxTeams: parseInt(e.target.value) })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="format">Tournament Format</Label>
                            <select
                                id="format"
                                className="w-full rounded-md border border-input bg-background px-3 py-2"
                                value={formData.format}
                                onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                                required
                            >
                                <option value="KNOCKOUT">Knockout</option>
                                <option value="LEAGUE">League</option>
                                <option value="GROUP_KNOCKOUT">Group Stage + Knockout</option>
                            </select>
                        </div>

                        <div className="flex justify-end gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push("/admin/dashboard")}
                            >
                                Cancel
                            </Button>
                            <Button type="submit">Create Tournament</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
} 