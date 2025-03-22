"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { onSnapshot, doc, query, collection, where } from "firebase/firestore"
import { clientDb } from "@/lib/firebase"
import { Tournament, Team, Match } from "@/types"
import { FirebaseService } from "@/src/services/firebase/FirebaseService"

export default function TournamentDetailsPage({ params }: { params: { id: string } }) {
    const [tournament, setTournament] = useState<Tournament | null>(null)
    const [teams, setTeams] = useState<Team[]>([])
    const [matches, setMatches] = useState<Match[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        // Real-time tournament updates
        const unsubTournament = onSnapshot(
            doc(clientDb, "tournaments", params.id),
            (doc) => {
                if (doc.exists()) {
                    setTournament({ id: doc.id, ...doc.data() } as Tournament)
                } else {
                    router.push("/admin/tournaments")
                }
            }
        )

        // Real-time teams updates
        const unsubTeams = onSnapshot(
            query(collection(clientDb, "teams"), where("tournamentId", "==", params.id)),
            (snapshot) => {
                const teamsData: Team[] = []
                snapshot.forEach((doc) => {
                    teamsData.push({ id: doc.id, ...doc.data() } as Team)
                })
                setTeams(teamsData)
            }
        )

        // Real-time matches updates
        const unsubMatches = onSnapshot(
            query(collection(clientDb, "matches"), where("tournamentId", "==", params.id)),
            (snapshot) => {
                const matchesData: Match[] = []
                snapshot.forEach((doc) => {
                    matchesData.push({ id: doc.id, ...doc.data() } as Match)
                })
                setMatches(matchesData)
            }
        )

        setLoading(false)

        return () => {
            unsubTournament()
            unsubTeams()
            unsubMatches()
        }
    }, [params.id, router])

    // ... rest of the component
} 