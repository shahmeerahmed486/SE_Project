"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStatus } from "@/src/hooks/useAuthStatus"
import { UserRole } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function ManagementDashboard() {
    const router = useRouter()
    const { user, loading } = useAuthStatus()
    const [tournaments, setTournaments] = useState([])

    useEffect(() => {
        if (!loading && (!user || user.role !== UserRole.MANAGEMENT)) {
            router.push('/login')
        }
    }, [user, loading, router])

    if (loading) {
        return <div>Loading...</div>
    }

    if (!user || user.role !== UserRole.MANAGEMENT) {
        return null
    }

    return (
        <div className="container py-10">
            <h1 className="text-3xl font-bold mb-8">Management Dashboard</h1>
            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Assigned Tournaments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {tournaments.length === 0 ? (
                                <p className="text-muted-foreground">No tournaments assigned yet.</p>
                            ) : (
                                tournaments.map((tournament: any) => (
                                    <div key={tournament.id} className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-medium">{tournament.name}</h3>
                                            <p className="text-sm text-muted-foreground">
                                                {tournament.status}
                                            </p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            onClick={() => router.push(`/management/tournaments/${tournament.id}`)}
                                        >
                                            Manage
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
} 